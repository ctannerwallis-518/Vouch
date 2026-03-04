export default async function handler(req, res) {
    const { q, type } = req.query;
    
    const creds = Buffer.from(
      `12fd53f00e134d7698673f5c1445f8b4:8b1d9149aef844e4bc6f8ba707905bb3`
    ).toString("base64");
  
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
  
    const { access_token } = await tokenRes.json();
  
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type}&limit=8`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
  
    const data = await searchRes.json();
    res.status(200).json(data);
  }