const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const docClient = new AWS.DynamoDB.DocumentClient()
const { MetricUnit } = require('../lib/helper/models')
const { logger_setup, putMetric, logMetric } = require('../lib/logging/logger')
let log

let _cold_start = true

exports.notifiyNewItemHandler = async (event, context) => {
  return AWSXRay.captureAsyncFunc('## Handler', async (subsegment) => {
    log = logger_setup()
    let response

    log.info(event)
    log.info(context)

    try {
      if (_cold_start) {
        //Metrics
        await logMetric(name = 'ColdStart', unit = MetricUnit.Count, value = 1, { service: 'item_service', function_name: context.functionName })
        _cold_start = false
      }
      /*
      if (event.httpMethod !== 'GET') {
        log.error({ "operation": "get-by-id", 'method': 'getByIdHandler', "details": `getById only accept GET method, you tried: ${event.httpMethod}` })
        await logMetric(name = 'UnsupportedHTTPMethod', unit = MetricUnit.Count, value = 1, { service: 'item_service', operation: 'get-by-id' })
        throw new Error(`notifiyNewItemHandler only accept GET method, you tried: ${event.httpMethod}`)
      }
      */
     
      const record = JSON.parse(event.Records[0].Sns.Message)
      response = await getItem(record, subsegment)

      //Metrics
      await logMetric(name = 'SuccessfulNewItemNotification', unit = MetricUnit.Count, value = 1, { service: 'item_service', operation: 'get-by-id' })
      //Tracing
      log.debug('Adding New Item Notification annotation')
      //subsegment.addAnnotation('ItemID', id)
      subsegment.addAnnotation('Status', 'SUCCESS')
    } catch (err) {
      //Tracing
      log.debug('Adding New Item Notification annotation before raising error')
      //subsegment.addAnnotation('ItemID', id)
      subsegment.addAnnotation('Status', 'FAILED')
      //Logging
      log.error({ "operation": "notify-item", 'method': 'notifiyNewItemHandler', "details": err })

      //Metrics
      await logMetric(name = 'FailedGetNewItemNotification', unit = MetricUnit.Count, value = 1, { service: 'item_service', operation: 'notify-item' })
    } finally {
      subsegment.close()
    }
    log.info({ operation: 'notify-item', 'method': 'notifiyNewItemHandler', body: response })
    return response
  }, AWSXRay.getSegment());
}


const getItem = async (record, segment) => {
  return AWSXRay.captureAsyncFunc('## subscribeSNSNewItem', async (subsegment) => {
    let response
    try {
      response = JSON.stringify(record)

      //Logging
      log.info({ "operation": "notify-item", 'method': 'getItem', "details": response })
      log.debug('New user inserted with id')
    } catch (err) {
      log.error({ "operation": "notify-item", 'method': 'getItem', "details": err })
      throw err
    } finally {
      subsegment.close()
    }
    return response
  }, segment);
}