const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "ilogan@taskapp.com",
    subject: "Welcome to Task App",
    text: `Welcome to the app, ${name}. We hope you make good use of it!`
  });
};

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "ilogan@taskapp.com",
    subject: "Task App Membership Cancellation",
    text: `We're sorry to see you go, ${name}. Feel free to come back if you're ever in need of our services again!`
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail
};
