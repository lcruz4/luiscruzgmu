import Mailjet from 'node-mailjet';

const handler = (req, res) => {
  const { name, email, message } = JSON.parse(req.body);

  if (!name || !email || !message) {
    res.status(400).json({ success: false, error: 'please provide name, email, and message' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'please use POST' });
    return;
  }

  if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
    res.status(500).json({ success: false, error: 'environment configuration error' });
    return;
  }

  const mailjet = new Mailjet({
    apiKey: process.env.MJ_APIKEY_PUBLIC,
    apiSecret: process.env.MJ_APIKEY_PRIVATE,
    config: {
      version: 'v3.1'
    }
  });

  const request = mailjet
    .post('send')
    .request({
      Messages: [
        {
          From: {
            Email: "luis@luiscruzgmu.com",
            Name: `Contact form - luiscruzgmu.com`
          },
          To: [
            {
              Email: "luis@luiscruzgmu.com",
              Name: "Luis Cruz"
            }
          ],
          Subject: `Contacted by: ${name} - ${email}`,
          HtmlPart: `${message}<br/><br/><a href='mailto:${email}'>Reply?</a>`
        }
      ]
    })

    request
    .then((result) => {
        console.dir(result.body)
        res.status(200).json({ success: true });
    })
    .catch((err) => {
        console.log(err.statusCode)
        res.status(err.statusCode).json({ success: false, error: err });
    })
};

export default handler;
