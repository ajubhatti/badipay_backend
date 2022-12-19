const axios = require("axios");
const { sms } = require("../config/keys");

const sendRegisterSms = async (mobileNo, otp) => {
  const payload = {
    data: [
      {
        destination: mobileNo,
        source: sms.source,
        type: sms.type,
        entityId: sms.entityId,
        tempId: "1207165289294413488",
        content: `Thank you for registering with us. Your One Time Password :- ${otp} BADIPAY`,
      },
    ],
  };
  const headers = {
    apiKey: sms.key,
  };
  return await axios
    .post("http://vas.sevenomedia.com/domestic/sendsms/jsonapi.php", payload, {
      headers,
    })
    .then((res) => {
      console.log(`Status: ${res.status}`);
      console.log("Body: ", res.data);
      return res;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
};

const sendForgotPasswordSms = async (mobileNo, otp) => {
  const payload = {
    data: [
      {
        destination: mobileNo,
        source: sms.source,
        type: sms.type,
        entityId: sms.entityId,
        // tempId: "",
        content: `Your Forgot Password OTP :- ${otp} BADIPAY`,
      },
    ],
  };
  const headers = {
    apiKey: sms.key,
  };
  console.log({ payload, headers });
  return await axios
    .post("http://vas.sevenomedia.com/domestic/sendsms/jsonapi.php", payload, {
      headers,
    })
    .then((res) => {
      console.log(res.data);
      return res;
    })
    .catch((err) => {
      return err;
    });
};

const sendChangeEPinSms = async (mobileNo, otp) => {
  const payload = {
    data: [
      {
        destination: mobileNo,
        source: sms.source,
        type: sms.type,
        entityId: sms.entityId,
        tempId: "",
        content: `Your change ePin OTP :- ${otp} BADIPAY`,
      },
    ],
  };
  const headers = {
    apiKey: sms.key,
  };
  return await axios
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
};

const sendResetPasswordSMS = async (mobileNo, message) => {
  const payload = {
    data: [
      {
        destination: mobileNo,
        source: sms.source,
        type: sms.type,
        entityId: sms.entityId,
        tempId: "",
        content: message,
      },
    ],
  };
  const headers = {
    apiKey: sms.key,
  };
  return await axios
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
};

module.exports = {
  sendRegisterSms,
  sendForgotPasswordSms,
  sendChangeEPinSms,
  sendResetPasswordSMS,
};
