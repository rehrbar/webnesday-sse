import bodyParser from 'body-parser';
import express from 'express';

const port = process.env.PORT || 3000;
const app = express();

// Enable json requests.
app.use(bodyParser.json());

// Stores a list of all connected clients.
let clients: Array<{
    id: string,
    response: express.Response
}> = [];

// The shared data, could be in a database or memory store.
const validVotes = [1, 2, 3, 4, 5];
const votes = new Map<string, { votes: number}>();

function sendClientCountToAll() {
    clients.forEach(client => client.response.write(`event: clients\ndata: ${clients.length}\n\n`));
}

function sendVotesToAll() {
    const serializedVotes = Object.fromEntries(votes);
    clients.forEach(client => client.response.write(`event: votes\ndata: ${JSON.stringify({ votes: serializedVotes })}\n\n`));
}

// Endpoint for clients to subscribe for updates.
app.get('/events', (request: express.Request, response: express.Response) => {
  // Client will keep the connection open with these headers.
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  // At this point, the missed events could be fed using an offset indicated by Last-Event-ID.
  response.write(`data: ${JSON.stringify({status: "joined"})}\n\n`);

  // Store the client so updates can be broadcasted.
  const clientId = self.crypto.randomUUID();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);
  sendClientCountToAll();

  // Handle client disconnecting and remove them from the list receiving updates.
  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
    sendClientCountToAll();
  });
});

// Endpoint to submit a new vote.
app.post('/votes', (request: express.Request, response: express.Response) => {
    const { vote } = request.body;
    if(validVotes.includes(vote)) {
      // Update the vote count.
      const t = votes.get(vote) || {votes: 0};
      t.votes += 1;
      votes.set(vote, t);

      response.sendStatus(201);

      sendVotesToAll();
    }
});

// Endpoint to delete all stored votes.
app.delete('/votes', (request: express.Request, response: express.Response) => {
    votes.clear();
    sendVotesToAll();
    response.sendStatus(200);
});

// Serve static files, e.g. the slides or the UI for this demo.
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
})