import express from 'express';
import cors from 'cors';

export const app = express();

app.use(cors());
app.use(express.json());


// Mock data 
const mockDataSets = [
    { status: "streaming", token: "[]", text: "[]" },
  
    { status: "streaming", token: "Let's upgrade the visuals in scene three", text: "[]Let's upgrade the visuals in scene three" },
  
    { status: "streaming", token: " by adding a new overlay and refining the timing", text: "[]Let's upgrade the visuals in scene three by adding a new overlay and refining the timing" },
  
    {
      status: "streaming",
      token: "<edit_card>\ncardid:123abc\nold_text:Camera zooms on hero’s face\nnew_text:Slow-motion zoom with glitch effect for dramatic impact\n</edit_card>",
      text: "[]Let's upgrade the visuals in scene three by adding a new overlay and refining the timing<edit_card>\ncardid:123abc\nold_text:Camera zooms on hero’s face\nnew_text:Slow-motion zoom with glitch effect for dramatic impact\n</edit_card>"
    },
  
    {
      status: "streaming",
      token: "<edit_card>\ncardid:456def\nold_text:Sound: basic swoosh\nnew_text:Sound: layered whoosh with echo to emphasize movement\n</edit_card>",
      text: "[]Let's upgrade the visuals in scene three by adding a new overlay and refining the timing<edit_card>\ncardid:123abc\nold_text:Camera zooms on hero’s face\nnew_text:Slow-motion zoom with glitch effect for dramatic impact\n</edit_card><edit_card>\ncardid:456def\nold_text:Sound: basic swoosh\nnew_text:Sound: layered whoosh with echo to emphasize movement\n</edit_card>"
    },
  
    {
      status: "streaming",
      token: "[]I’ve enhanced the visual storytelling to match your energetic editing style.\n\n1",
      text: "[]Let's upgrade the visuals in scene three by adding a new overlay and refining the timing<edit_card>\ncardid:123abc\nold_text:Camera zooms on hero’s face\nnew_text:Slow-motion zoom with glitch effect for dramatic impact\n</edit_card><edit_card>\ncardid:456def\nold_text:Sound: basic swoosh\nnew_text:Sound: layered whoosh with echo to emphasize movement\n</edit_card>[]I’ve enhanced the visual storytelling to match your energetic editing style.\n\n1"
    },
  
    {
      status: "streaming",
      token: ". **Visual Edit**: Upgraded zoom effect for more punch.",
      text: "[]Let's upgrade the visuals in scene three by adding a new overlay and refining the timing<edit_card>\ncardid:123abc\nold_text:Camera zooms on hero’s face\nnew_text:Slow-motion zoom with glitch effect for dramatic impact\n</edit_card><edit_card>\ncardid:456def\nold_text:Sound: basic swoosh\nnew_text:Sound: layered whoosh with echo to emphasize movement\n</edit_card>[]I’ve enhanced the visual storytelling to match your energetic editing style.\n\n1. **Visual Edit**: Upgraded zoom effect for more punch."
    },
  
    {
      status: "streaming",
      token: "\n2. **Audio Edit**: Echoing whoosh adds dynamic flair.",
      text: "[]Let's upgrade the visuals in scene three by adding a new overlay and refining the timing<edit_card>\ncardid:123abc\nold_text:Camera zooms on hero’s face\nnew_text:Slow-motion zoom with glitch effect for dramatic impact\n</edit_card><edit_card>\ncardid:456def\nold_text:Sound: basic swoosh\nnew_text:Sound: layered whoosh with echo to emphasize movement\n</edit_card>[]I’ve enhanced the visual storytelling to match your energetic editing style.\n\n1. **Visual Edit**: Upgraded zoom effect for more punch.\n2. **Audio Edit**: Echoing whoosh adds dynamic flair."
    },
  
    {
      type: "final_message",
      message: "[]Let's upgrade the visuals in scene three by adding a new overlay and refining the timing<edit_card>\ncardid:123abc\nold_text:Camera zooms on hero’s face\nnew_text:Slow-motion zoom with glitch effect for dramatic impact\n</edit_card><edit_card>\ncardid:456def\nold_text:Sound: basic swoosh\nnew_text:Sound: layered whoosh with echo to emphasize movement\n</edit_card>[]I’ve enhanced the visual storytelling to match your energetic editing style.\n\n1. **Visual Edit**: Upgraded zoom effect for more punch.\n2. **Audio Edit**: Echoing whoosh adds dynamic flair."
    }
  ];
  
//Get request for the api response
app.get('/api/stream', (req, res) => {
 
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    let currentIndex = 0;

    const streamData = () => {
        if (currentIndex < mockDataSets.length) {
            const data = mockDataSets[currentIndex];
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            currentIndex++;
            // Continue streaming until final comes
            if (data.type !== "final_message") {
                setTimeout(streamData, 100); // 100ms delay
            } else {
                res.end(); // End the stream
            }
        }
    };

    // Start streaming
    streamData();

    // Handle client disconnect
    req.on('close', () => {
        console.log('Client disconnected');
    });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Stream endpoint: http://localhost:${PORT}/api/stream`);
});