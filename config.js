const config = {
    sequelize: {
        dialect: 'mysql',
        database: '${MYSQL_DB}',
        username: '${MYSQL_USERNAME}',
        password: '${MYSQL_PASSWORD}',
        host: '${MYSQL_HOST}',
        port: 3306,
        pool: {
            max: 10,
            min: 0,
            idle: 10000
        },
        define: {
            underscored: true,
            freezeTableName: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci'
        },
        timezone: '+08:00'
    },
    redis: {
        host: '127.0.0.1'
    },
    core: {
        torrent_bin_max_length: 1 * 1024 * 1024, // 1MB
        torrent_files_max_length: 10 * 1024 * 1024 * 1024, // 10GB
        torrent_files_max_count: 1024,
        torrent_expire_days: 30,
        torrent_failed_days: 7, // todo
        torrent_failed_percent: 0.1, // todo
        file_signature_key: '${SAME_AS_OPENRESTY_CONF}',
        download_node: 'node-0', // todo
        torrent_cucurrent_max: 6, // todo
        api_token: 'changeme',
        force_purge: true,
        force_purge_space: 5 * 1024 * 1024 * 1024 // if node space lower than 5GB
    },
    node: [
        {
            name: 'node-0',
            cdn: [
                {
                    location: 'CA',
                    url: 'http://${FROG_NODE_URL}'
                }
            ],
            baseURL: 'http://${FROG_NODE_URL}',
            weight: 5,
            token: 'changeme'
        }
    ]
}

module.exports = config
