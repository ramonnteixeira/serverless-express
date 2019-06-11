'use strict'

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const TABLE = 'todo';
const dynamoDb;
if (process.env.IS_OFFLINE) {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'DEFAULT_ACCESS_KEY',  // needed if you don't have aws credentials at all in env
    secretAccessKey: 'DEFAULT_SECRET' // needed if you don't have aws credentials at all in env
  });
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}


app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
  const number = Math.floor(Math.random() * 3) + 1;

  fs.readFile(path.join(__dirname, `/public/${number}.jpg`), 'base64', (err, img) => {
    const dataUrl = `data:image/jpeg;base64, ${img}`
    res.send(
      `<img style="align: 0 auto; max-height: 400px; max-width: 400px" src="${dataUrl}">`
    );
  });
});

app.get('/todo/:id', (req, res) => {
  const params = {
    TableName: TABLE,
    Key: {
      _id: req.params.id,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get todo' });
    }

    if (result.Item) {
      const {_id, title} = result.Item;
      res.json({ _id, title });
    } else {
      res.status(404).json({ error: "Todo not found" });
    }
  });
})

app.post('/todo', (req, res) => {
  const { _id, title } = req.body;
  if (typeof _id !== 'string') {
    res.status(400).json({ error: '"_id" must be a string' });
  } else if (typeof title !== 'string') {
    res.status(400).json({ error: '"title" must be a string' });
  }

  const params = {
    TableName: TABLE,
    Item: { _id, title },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create todo' });
    }
    res.json({ _id, title });
  });
})

module.exports.handler = serverless(app);