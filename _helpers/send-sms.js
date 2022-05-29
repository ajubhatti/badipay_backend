const axios = require("axios");
// const request = require('request-promise');

const sendSms = async (mobileNo, otp) => {
  const payload = {
    data: [
      {
        destination: mobileNo,
        source: "BadiPe",
        type: "TEXT",
        entityId: "1201161207424046279",
        tempId: "",
        content: `Thank you for registering with us. Your One Time Password :- ${otp}`,
      },
    ],
  };
  const headers = {
    Authorization: "Bearer my-token",
    "My-Custom-Header": "foobar",
    apiKey: "YmFkaXBheTowN1gzeUZrcA==",
  };
  const response = await axios
    .post("http://vas.sevenomedia.com/domestic/sendsms/jsonapi.php", payload, {
      headers,
    })
    .then((res) => {
      console.log(`Status: ${res.status}`);
      console.log("Body: ", res.data);
    })
    .catch((err) => {
      console.error(err);
    });

  //         const options = {
  //     method: 'POST',
  //     uri: 'https://requestedAPIsource.com/api',
  //     body: req.body,
  //     json: true,
  //     headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': 'bwejjr33333333333'
  //     }
  // }

  // request(options).then(function (response){
  //     res.status(200).json(response);
  // })
  // .catch(function (err) {
  //     console.log(err);
  // })
};

module.exports = sendSms;
