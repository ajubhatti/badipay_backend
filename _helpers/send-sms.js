const axios = require('axios')

const sendSms = () => {
     const response = await axios.post("http://vas.sevenomedia.com/domestic/sendsms/jsonapi.php")
        res.json(response.data)
};

module.exports = sendSms;
