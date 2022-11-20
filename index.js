const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ho0d8c2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        const appointmentOptionCollection=client.db('doctorsPortal').collection('appointmentOptions');
        const bookingsCollection = client.db('doctorsPortal').collection('bookings');

        app.get('/appointmentOptions', async(req, res)=>{
            const date = req.query.date;
            const query ={};
            const options = await appointmentOptionCollection.find(query).toArray();

            //get the bookings of the provided date
            const bookingQuery = {date : date};
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            //code carefully
            options.forEach(option =>{
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookSlots.includes(slot));
                option.slots = remainingSlots;
            })
            res.send(options);
        })

        //API naming conventions
        /***
         * bookings
         * app.get('/bookings')
         * app.get('/bookings/:id')
         * app.post('/bookings')
         * app.patch('/bookings/:id')
         * app.delete('/bookings/:id')
         */

        app.post('/bookings', async(req, res)=>{
            const booking = req.body;
            const query = {
                email: booking.email,
                date: booking.date,
                treatment: booking.treatment
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if(alreadyBooked.length){
                const message= `You have already booked ${booking.date}`;
                return res.send({acknowledged: false, message});
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
    }
    finally{

    }
}
run().catch(e => console.error(e));


app.get('/', (req, res) => {
    res.send('Doctors portal server is running')
})

app.listen(port, () => {
    console.log(`Doctors portal listening on port ${port}`)
});