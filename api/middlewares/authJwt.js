import jwt from 'jsonwebtoken';

const WS_JWT_SECRET = process.env.WS_JWT_SECRET;

const verifyToken = (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(403).send({ message: 'No token provided!' });
    }

    jwt.verify(token, WS_JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        req.userId = decoded.context.user.id;
        next();
    });
};

export default { verifyToken };