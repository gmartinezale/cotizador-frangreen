import { Document, Schema, model } from "mongoose";

interface ISequence extends Document {
  sequence: {
    quoter: number;
    order: number;
  }
}

const SequenceSchema = new Schema<ISequence>(
  {
    sequence: {
      quoter: { type: Number, default: 1000 },
      order: { type: Number, default: 1000 },
    },
  },
  { timestamps: true },
);

let Sequence: any;
try {
  Sequence = model("Sequence");
} catch (error) {
  Sequence = model<ISequence>("Sequence", SequenceSchema);
}

export default Sequence;
