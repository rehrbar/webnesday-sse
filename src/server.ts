import bodyParser from 'body-parser';
import express from 'express';

const port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.json());

let clients: Array<{
    id: string,
    response: express.Response
}> = [];
function eventsHandler(request: express.Request, response: express.Response) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  // TODO send server status
  response.write(`data: ${JSON.stringify({status: "joined"})}\n\n`);

  const clientId = self.crypto.randomUUID();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}

app.get('/events', eventsHandler);

function sendEventsToAll(newFact:string) {
    clients.forEach(client => client.response.write(`data: ${JSON.stringify({newFact})}\n\n`))
}

async function addFact(request: express.Request, response: express.Response) {
    const newFact = request.body;
    response.json(newFact);
    // TODO update server status
    return sendEventsToAll(newFact);
}

app.post('/messages', addFact)

app.use(express.static('public'));

setInterval(() => {
    console.log("clients connected", clients.length)
    clients.forEach(client => client.response.write(`event: clients\ndata: ${clients.length}\n\n`))
}, 1000);

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
})