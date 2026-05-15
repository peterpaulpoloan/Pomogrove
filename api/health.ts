export default function handler(req: any, res: any) {
  res.json({ status: 'online', timestamp: new Date() });
}