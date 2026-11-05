// Email-safe HTML: tables, inline styles, solid hex colors (no CSS vars/rgba/flex)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const receivedAt = () =>
  new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const MONO = "'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace";

const page = ({
  title,
  background,
  fontFamily,
  fontsHref,
  body,
}: {
  title: string;
  background: string;
  fontFamily: string;
  fontsHref: string;
  body: string;
}) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="${
  background === '#0b0f1a' ? 'dark' : 'light'
}">
<title>${escapeHtml(title)}</title>
<link href="${fontsHref}" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${background};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${background};">
<tr><td align="center" style="padding:32px 16px;font-family:${fontFamily};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
${body}
</table>
</td></tr>
</table>
</body>
</html>`;

// Admin theme: dark navy, cyan accents, mono labels
const ADMIN = {
  bg: '#0b0f1a',
  panel: '#070a12',
  raised: '#0d1322',
  line: '#1e2a44',
  text: '#d6e2ff',
  muted: '#7b8bb0',
  faint: '#4b5a7d',
  cyan: '#22d3ee',
  cyanSoft: '#67e8f9',
  cyanFill: '#0e2530',
  pink: '#f472b6',
};

const adminLabel = (label: string) =>
  `<p style="margin:0 0 6px;font-family:${MONO};font-size:11px;letter-spacing:0.2em;color:${ADMIN.faint};">${label}</p>`;

export const contactEmail = ({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const mailto = `mailto:${encodeURIComponent(
    email,
  )}?subject=${encodeURIComponent('Re: your message on lcruz.dev')}`;

  const html = page({
    title: `Message from ${name}`,
    background: ADMIN.bg,
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@500;600&display=swap',
    body: `
<tr><td style="background:${ADMIN.panel};border:1px solid ${
      ADMIN.line
    };border-bottom-color:${
      ADMIN.cyan
    };border-radius:8px 8px 0 0;padding:14px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="font-family:${MONO};font-size:13px;font-weight:600;letter-spacing:0.2em;color:${
      ADMIN.cyan
    };">&#9670; LCRUZ//CONTACT</td>
    <td align="right" style="font-family:${MONO};font-size:11px;color:${
      ADMIN.muted
    };"><span style="color:${
      ADMIN.cyan
    };">&#9679;</span>&nbsp; ${receivedAt()} ET</td>
  </tr></table>
</td></tr>
<tr><td style="background:${ADMIN.bg};border:1px solid ${
      ADMIN.line
    };border-top:0;border-radius:0 0 8px 8px;padding:28px 24px 32px;">
  ${adminLabel('SYS://INBOUND_MESSAGE')}
  <h1 style="margin:0 0 24px;font-size:24px;font-weight:600;color:${
    ADMIN.text
  };">New message from ${safeName}</h1>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid ${
    ADMIN.line
  };border-radius:6px;">
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${
        ADMIN.line
      };width:72px;font-family:${MONO};font-size:11px;letter-spacing:0.15em;color:${
        ADMIN.faint
      };">NAME</td>
      <td style="padding:12px 16px;border-bottom:1px solid ${
        ADMIN.line
      };font-size:14px;color:${ADMIN.text};">${safeName}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;width:72px;font-family:${MONO};font-size:11px;letter-spacing:0.15em;color:${
        ADMIN.faint
      };">EMAIL</td>
      <td style="padding:12px 16px;font-size:14px;"><a href="mailto:${safeEmail}" style="color:${
        ADMIN.cyanSoft
      };text-decoration:none;">${safeEmail}</a></td>
    </tr>
  </table>
  ${adminLabel('PAYLOAD')}
  <div style="margin:0 0 28px;padding:16px;background:${
    ADMIN.raised
  };border:1px solid ${ADMIN.line};border-left:2px solid ${
    ADMIN.cyan
  };border-radius:6px;font-size:15px;line-height:1.6;color:${
    ADMIN.text
  };white-space:pre-wrap;word-break:break-word;">${escapeHtml(message)}</div>
  <a href="${escapeHtml(
    mailto,
  )}" style="display:inline-block;padding:10px 18px;background:${
    ADMIN.cyanFill
  };border:1px solid ${
    ADMIN.cyan
  };border-radius:4px;font-family:${MONO};font-size:12px;font-weight:600;letter-spacing:0.12em;color:${
    ADMIN.cyanSoft
  };text-decoration:none;">REPLY &rarr;</a>
</td></tr>
<tr><td align="center" style="padding:16px 0 0;font-family:${MONO};font-size:11px;color:${
      ADMIN.faint
    };">Sent from the contact form on <a href="https://lcruz.dev" style="color:${
      ADMIN.muted
    };text-decoration:none;">lcruz.dev</a></td></tr>`,
  });

  const text = `New message from ${name} <${email}>\n\n${message}\n\n— lcruz.dev contact form`;

  return { subject: `Contacted by: ${name} - ${email}`, html, text };
};

// Workout tracker "mist" theme: pale teal, cyan/pink accents
const MIST = {
  ground: '#e2eff1',
  header: '#cdeaed',
  surface: '#fbfefe',
  raised: '#eef7f8',
  line: '#bcd5da',
  text: '#0e2a2f',
  muted: '#4a6469',
  ink: '#040404',
  cyan: '#04c2c9',
  cyanText: '#00747a',
  pink: '#ec3e85',
};

export const planRequestEmail = ({ email }: { email: string }) => {
  const safeEmail = escapeHtml(email);
  const mailto = `mailto:${encodeURIComponent(
    email,
  )}?subject=${encodeURIComponent('Your Workout Tracker plan')}`;

  const html = page({
    title: `Free plan request: ${email}`,
    background: MIST.ground,
    fontFamily:
      "Raleway, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Raleway:wght@500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap',
    body: `
<tr><td style="background:${MIST.header};border:1px solid ${
      MIST.line
    };border-bottom:2px solid ${
      MIST.cyan
    };border-radius:16px 16px 0 0;padding:22px 24px 18px;">
  <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${
    MIST.muted
  };">
    Workout Tracker &nbsp;<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${
      MIST.pink
    };color:${MIST.ink};letter-spacing:0.04em;">New</span>
  </p>
  <h1 style="margin:0;font-size:26px;line-height:32px;font-weight:800;color:${
    MIST.text
  };">Free plan request</h1>
  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:${
    MIST.muted
  };">${receivedAt()} ET</p>
</td></tr>
<tr><td style="background:${MIST.surface};border:1px solid ${
      MIST.line
    };border-top:0;border-radius:0 0 16px 16px;padding:24px;">
  <p style="margin:0 0 16px;font-size:15px;line-height:1.5;font-weight:500;color:${
    MIST.text
  };">Someone wants access to Workout Tracker. Set them up with a plan and let them know.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    <tr><td style="padding:14px 16px;background:${
      MIST.raised
    };border:1px solid ${MIST.line};border-radius:12px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${
        MIST.muted
      };">Requested by</p>
      <a href="mailto:${safeEmail}" style="font-family:${MONO};font-size:16px;font-weight:700;color:${
        MIST.cyanText
      };text-decoration:none;word-break:break-all;">${safeEmail}</a>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td align="center" style="border:1px solid ${
      MIST.line
    };border-radius:14px;">
      <a href="${escapeHtml(
        mailto,
      )}" style="display:block;padding:14px 16px;font-size:15px;font-weight:700;color:${
        MIST.cyanText
      };text-decoration:none;">Reply to request</a>
    </td>
  </tr></table>
</td></tr>
<tr><td align="center" style="padding:16px 0 0;font-size:12px;font-weight:500;color:${
      MIST.muted
    };">Sent from <a href="https://lcruz.dev/sign-in" style="color:${
      MIST.cyanText
    };text-decoration:none;">lcruz.dev/sign-in</a></td></tr>`,
  });

  const text = `${email} is requesting a free workout tracker plan.\n\n— lcruz.dev Workout Tracker`;

  return { subject: `Free plan request: ${email}`, html, text };
};
