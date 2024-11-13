import mongoose, { model } from "mongoose";

const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image:{
        type: String
    }
}
,{timestamps: true});

const Country = mongoose.models.Country || model('Country',countrySchema)
export default Country;