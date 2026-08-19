import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  // Naya form banao — form + uske fields dono ek saath
  async create(workspaceId: string, dto: CreateFormDto) {
    return this.prisma.form.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        // "create" nested syntax — Prisma khud FormField rows bana dega,
        // aur unko is Form se link kar dega (formId khud set ho jayega)
        fields: {
          create: dto.fields.map((f, index) => ({
            label: f.label,
            type: f.type,
            required: f.required || false,
            options: f.options || [],
            order: index, // Array mein jis order mein aaye, wahi order save hoga
          })),
        },
      },
      include: { fields: true }, // Response mein fields bhi wapas bhejo
    });
  }

  // Workspace ke saare forms ki list (Forms page ke liye)
  async findAll(workspaceId: string) {
    return this.prisma.form.findMany({
      where: { workspaceId },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { leads: true } }, // Har form pe kitni leads aayi, count dikhane ke liye
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Ek specific form ki detail (edit page ke liye)
  async findOne(workspaceId: string, formId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, workspaceId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  // Form update karo — agar naye fields bheje gaye hain, purane delete karke naye bana do
  async update(workspaceId: string, formId: string, dto: UpdateFormDto) {
    const existing = await this.prisma.form.findFirst({
      where: { id: formId, workspaceId },
    });
    if (!existing) throw new NotFoundException('Form not found');

    // $transaction — matlab yeh saare steps ya toh sab honge, ya koi nahi
    // (agar beech mein error aaye, koi bhi partial data save nahi hoga)
    return this.prisma.$transaction(async (tx) => {
      if (dto.fields) {
        // Purane fields hata do, naye bana do — simplest approach reordering ke liye
        await tx.formField.deleteMany({ where: { formId } });
        await tx.formField.createMany({
          data: dto.fields.map((f, index) => ({
            formId,
            label: f.label,
            type: f.type,
            required: f.required || false,
            options: f.options || [],
            order: index,
          })),
        });
      }

      return tx.form.update({
        where: { id: formId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
        },
        include: { fields: { orderBy: { order: 'asc' } } },
      });
    });
  }

  // Form publish/unpublish karo — publish hone ke baad hi embed code kaam karega
  async togglePublish(
    workspaceId: string,
    formId: string,
    isPublished: boolean,
  ) {
    const existing = await this.prisma.form.findFirst({
      where: { id: formId, workspaceId },
    });
    if (!existing) throw new NotFoundException('Form not found');

    return this.prisma.form.update({
      where: { id: formId },
      data: { isPublished },
    });
  }

  async remove(workspaceId: string, formId: string) {
    const existing = await this.prisma.form.findFirst({
      where: { id: formId, workspaceId },
    });
    if (!existing) throw new NotFoundException('Form not found');

    return this.prisma.form.delete({ where: { id: formId } });
  }

  // PUBLIC use ke liye — sirf published form return karega
  // Workspace check nahi hai kyun ke yahan user logged in nahi hota,
  // isliye sirf formId aur isPublished se find karna hai
  async findPublicForm(formId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, isPublished: true },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!form) throw new NotFoundException('Form not found or not published');
    return form;
  }

  async submitLead(formId: string, data: Record<string, any>) {
    const form = await this.findPublicForm(formId);
    return this.prisma.lead.create({
      data: {
        formId: form.id,
        data,
      },
    });
  }
}
