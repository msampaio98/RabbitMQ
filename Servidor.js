const express = require('express');
const http = require('http');
const amqp = require('amqplib/callback_api');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

const queueName = 'hello';
let channel = null;

amqp.connect('amqp://localhost', function (error0, connection) {
  if (error0) {
    console.error(error0);
    return;
  }

  connection.createChannel(function (error1, ch) {
    if (error1) {
      console.error(error1);
      connection.close();
      return;
    }

    channel = ch;
    channel.assertQueue(queueName, { durable: true });
  });
});

io.on('connection', function (socket) {
  console.log('Cliente conectado');

  socket.on('message', function (data) {
    const message = data.message;

    channel.sendToQueue(queueName, Buffer.from(message));
    console.log('Mensagem recebida no RabbitMQ:', message);

    // Transmite a mensagem para todos os clientes conectados
    io.emit('message', { message });
  });

  socket.on('disconnect', function () {
    console.log('Cliente desconectado');
  });
});


server.listen(3000, function () {
  console.log('Server listening on port 3000');
});