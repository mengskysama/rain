Frog
===================
rain frontend api

Setup
------------
Install node v8.0.0+

Configure:

    /config.js
    /config/rain.conf

Install dependents

    > cd ${PATH_TO_REPO}
    > npm install

Run

    > node app.js
    > pm2 start app.js --watch

Test and Reload OpenResty with config:

    > ln -s ${PATH_TO_REPO}/config/rain.conf ${PATH_TO_OPENRESTY}/nginx/conf/site-enabled/
    > nginx -t
    > nginx -s reload

Contributing
------------

Contributions, complaints, criticisms, and whatever else are welcome. The source
code and issue tracker can be found on GitHub.

License
-------
MIT license. See ``LICENSE`` for details.

Koa: https://github.com/koajs/koa
