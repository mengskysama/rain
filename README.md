Rain
===================
rain frontend api

What is this?
------------

A webgui for easy to build bittorrent client distributed system.
But everything is just beginning ...

Feature
------------
Based on html5 online preview

Each user's task independent

Generate http file links with expire time

Roadmap
------------
Add provider for storage (c14,oss,etc..)

Improved multi-node support (task balance etc..)

Improved mangnet support

Improved config

Beautify web UI

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
    > cd cron & node task_sysnc.js # run sync task for sync task from frog
    > cd cron & node task_purge.js # run purge task for cleanup expire task

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
