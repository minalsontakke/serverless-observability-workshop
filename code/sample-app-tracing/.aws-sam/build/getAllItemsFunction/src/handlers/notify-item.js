const AWS = require('aws-sdk')

exports.notifiyNewItemHandler = async (event, context) => {
  let response
  try {
    const record = JSON.parse(event.Records[0].Sns.Message)
    response = await getItem(record)
  } catch (err) {
    throw err
  } finally {
    subsegment.close()
  }
  return response
}


const getItem = async (record) => {
  let response
  try {
    response = JSON.stringify(record)
  } catch (err) {
    throw err
  } finally {
    subsegment.close()
  }
  return response
}