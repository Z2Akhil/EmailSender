/**
 * Wraps editor/body HTML in an email-client-friendly shell:
 * centered 600px column, safe fonts, sensible defaults.
 *
 * Lives outside the editor component so server code (template seeds,
 * API routes) can use it without pulling TipTap into the bundle.
 */
export function wrapEmailHtml(innerHtml: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;">
  <div style="display:none;max-height:0;overflow:hidden;">&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#333333;">
${innerHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
