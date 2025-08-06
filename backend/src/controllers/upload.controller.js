const upload = async(req, res) => {
    const pdf_file = req.file

    console.log(pdf_file);
    
}

export {upload}