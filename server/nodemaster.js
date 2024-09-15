const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});




const sendMail = (to, sub, msg) => {
    transporter.sendMail({
        from: process.env.SMTP_FROM_ADDRESS,
        to: to,
        subject: sub,
        html:msg,
        text: "Hello world?", 

    })

    console.log("Email sent")

}


sendMail("oluwatosinadegoroye21@gmail.com", "this is account management system", "this is a test message for an api again")





// version two
// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true, // use SSL
//   auth: {
//     user: process.env.SMTP_USERNAME, // your Gmail email
//     pass: process.env.SMTP_PASSWORD, // your Gmail password or App Password (for security reasons)
//   },
// });



// const sendMail = async (to, sub, msg) => {
//   try {
//       let info = await transporter.sendMail({
//           from: process.env.SMTP_FROM_ADDRESS,
//           to: to,
//           subject: sub,
//           html: msg,
//           text: "Hello world?",
//       });
//       console.log("Email sent: %s", info.messageId);
//   } catch (error) {
//       console.error("Error sending email: ", error);
//   }
// }

// sendMail("oluwatosinadegoroye21@gmail.com", "This is account management system", "This is a test message for an API");

