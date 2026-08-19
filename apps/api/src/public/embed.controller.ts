import { Controller, Get, Header, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class EmbedController {
  constructor(private configService: ConfigService) {}

  @Get('embed.js')
  @Header('Content-Type', 'application/javascript; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  getEmbedScript(): string {
    const apiUrl =
      this.configService.get<string>('BACKEND_URL') ||
      'https://opendesk-production-ec29.up.railway.app';

    return `
(function () {
  // document.currentScript — jis <script> tag ne yeh file load ki, uska reference deta hai
  // isse hum data-form-id attribute padh sakte hain
  var scriptTag = document.currentScript;
  var formId = scriptTag.getAttribute('data-form-id');
  var apiUrl = '${apiUrl}';

  if (!formId) {
    console.error('OpenDesk Embed: data-form-id attribute missing');
    return;
  }

  // Container div banao jahan form dikhega — script tag ke turant baad insert karenge
  var container = document.createElement('div');
  container.id = 'opendesk-form-' + formId;
  container.style.maxWidth = '480px';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  scriptTag.parentNode.insertBefore(container, scriptTag.nextSibling);

  container.innerHTML = '<p style="color:#666;font-size:14px;">Loading form...</p>';

  // Form ka structure (fields) fetch karo public endpoint se
  fetch(apiUrl + '/public/forms/' + formId)
    .then(function (res) {
      if (!res.ok) throw new Error('Form not found');
      return res.json();
    })
    .then(function (form) {
      renderForm(form);
    })
    .catch(function () {
      container.innerHTML = '<p style="color:#c00;font-size:14px;">Unable to load form.</p>';
    });

  function renderForm(form) {
    var html = '<form id="od-form-' + formId + '" style="display:flex;flex-direction:column;gap:12px;">';

    if (form.name) {
      html += '<h3 style="margin:0 0 4px;font-size:18px;font-weight:600;">' + escapeHtml(form.name) + '</h3>';
    }
    if (form.description) {
      html += '<p style="margin:0 0 8px;font-size:13px;color:#666;">' + escapeHtml(form.description) + '</p>';
    }

    // Har field type ke liye alag HTML input banate hain
    form.fields.forEach(function (field) {
      var required = field.required ? 'required' : '';
      html += '<div style="display:flex;flex-direction:column;gap:4px;">';
      html += '<label style="font-size:13px;font-weight:500;">' + escapeHtml(field.label) + (field.required ? ' *' : '') + '</label>';

      if (field.type === 'TEXTAREA') {
        html += '<textarea name="' + field.id + '" ' + required + ' style="padding:8px;border:1px solid #ddd;font-size:14px;min-height:80px;"></textarea>';
      } else if (field.type === 'DROPDOWN') {
        html += '<select name="' + field.id + '" ' + required + ' style="padding:8px;border:1px solid #ddd;font-size:14px;">';
        html += '<option value="">Select...</option>';
        (field.options || []).forEach(function (opt) {
          html += '<option value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</option>';
        });
        html += '</select>';
      } else if (field.type === 'CHECKBOX') {
        html += '<input type="checkbox" name="' + field.id + '" ' + required + ' />';
      } else {
        // TEXT, EMAIL, PHONE — sab standard <input> hain, sirf type badalta hai
        var inputType = field.type === 'EMAIL' ? 'email' : field.type === 'PHONE' ? 'tel' : 'text';
        html += '<input type="' + inputType + '" name="' + field.id + '" ' + required + ' style="padding:8px;border:1px solid #ddd;font-size:14px;" />';
      }
      html += '</div>';
    });

    html += '<button type="submit" style="padding:10px;background:#111;color:#fff;border:none;font-size:14px;cursor:pointer;">Submit</button>';
    html += '<p id="od-msg-' + formId + '" style="font-size:13px;margin:0;"></p>';
    html += '</form>';

    container.innerHTML = html;

    var formEl = document.getElementById('od-form-' + formId);
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm(form, formEl);
    });
  }

  function submitForm(form, formEl) {
    var data = {};
    // formEl mein saare fields se value nikal ke ek object banate hain —
    // key form.fields ke label se aati hai taake backend readable data save kare
    form.fields.forEach(function (field) {
      var input = formEl.querySelector('[name="' + field.id + '"]');
      if (!input) return;
      if (field.type === 'CHECKBOX') {
        data[field.label] = input.checked;
      } else {
        data[field.label] = input.value;
      }
    });

    var msgEl = document.getElementById('od-msg-' + form.id);
    var submitBtn = formEl.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    fetch(apiUrl + '/public/forms/' + form.id + '/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: data }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Submit failed');
        formEl.style.display = 'none';
        msgEl.style.color = '#0a0';
        msgEl.textContent = 'Thank you! Your submission was received.';
      })
      .catch(function () {
        msgEl.style.color = '#c00';
        msgEl.textContent = 'Something went wrong. Please try again.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      });
  }

  // XSS se bachne ke liye — agar form ka naam/label mein koi <script> jaisa text ho,
  // usse plain text ki tarah dikhayenge, HTML ki tarah execute nahi hone denge
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
`;
  }
}
