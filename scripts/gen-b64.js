const fs = require('fs');

const config = `# 1. Landing Page (my-gurukul.org & www.my-gurukul.org)
server {
    listen 80;
    server_name my-gurukul.org www.my-gurukul.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name my-gurukul.org www.my-gurukul.org;

    ssl_certificate /etc/letsencrypt/live/my-gurukul.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/my-gurukul.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. MasterAdmin Console (console.my-gurukul.org)
server {
    listen 80;
    server_name console.my-gurukul.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name console.my-gurukul.org;

    client_max_body_size 50M;

    ssl_certificate /etc/letsencrypt/live/my-gurukul.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/my-gurukul.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. Admin Portal & Automatic Catch-All for Custom Client Domains
server {
    listen 80 default_server;
    server_name portal.my-gurukul.org _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl default_server;
    server_name portal.my-gurukul.org _;

    client_max_body_size 50M;

    ssl_certificate /etc/letsencrypt/live/my-gurukul.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/my-gurukul.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

const b64 = Buffer.from(config, 'utf8').toString('base64');
console.log(b64);
