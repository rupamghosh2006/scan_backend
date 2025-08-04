import MathpixClient from '../utils/MathpixClient.js';

const scanpdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    const mathpix = new MathpixClient({
      appId: process.env.MATHPIX_API_ID,
      appKey: process.env.MATHPIX_API_KEY
    });

    const data = await mathpix.uploadPdf(req.file.buffer, req.file.originalname);
    res.json(data);
  } catch (err) {
    console.error('Scanpdf error:', err);
    res.status(500).json({ error: err.message });
  }
};

export {scanpdf};