const Lang = imports.lang;
const { Gio, Soup, GLib } = imports.gi;

const DEFAULT_TIMEOUT = 30;

var BaseModule = class BaseModule {
    /**
     * Базовый класс модуля
     */

    constructor(data, timeout) {
        this.data = data || {
            'label': '',
            'val': NaN,
            'units': ''
        };

        this.timeout = timeout || DEFAULT_TIMEOUT;

        this.updateData();

        this._timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this.timeout,
            () => {
                this.updateData();
                return true;
            }
        );
    }

    /**
     * Абстрактный метод обновления данных, который нужно переопределить в наследниках
     */
    updateData() {

    }

    destroy() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }
    }
}

var CurrencyModule = class CurrencyModule extends BaseModule {
    updateData() {
        const URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
        let httpSession = new Soup.Session();
        let message = Soup.form_request_new_from_hash('GET', URL, {});

        httpSession.queue_message(message, Lang.bind(this, function(httpSess, message) {
            if (message.status_code !== 200) {
                this.data.val = NaN;
                return;
            };
            let json = JSON.parse(message.response_body.data);
            this.data.val = Number(json.Valute.USD.Value).toFixed(1);
        }));
    }
}

var FreeSpaceModule = class FreeSpaceModule extends BaseModule {
    updateData() {
        try {
            const command = ['df', '-h', '/'];
            let proc = Gio.Subprocess.new(
                command,
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    const regex = /\/dev\/.*$/gm;
                    const regex2 = /[^\s]+/gi;

                    stdout = stdout.toString().match(regex);

                    const params = stdout.toString().match(regex2);
                    this.data.val = params[3];
                } catch(e) {
                    logError(e);
                }
            });
        } catch(e) {
            logError(e);
        }
    }
}

var CpuModule = class CpuModule extends BaseModule {
    updateData() {
        // Код взят и немного доработан из расширения CpuMemInfo@xesnet.fr

        let cpuTotal = 0, cpuIdle;

        let fileStat = GLib.file_get_contents('/proc/stat');
        let linesStat = ('' + fileStat[1]).split('\n');

        for (let i = 0; i < linesStat.length; i++) {
            let values;

            if (linesStat[i].match(/^cpu /)) {
                values = linesStat[i].match(/^cpu\s*(.*)$/)[1].split(' ');
                cpuIdle = values[3];

                for (let i = 0; i < values.length; i++) {
                    cpuTotal += parseInt(values[i]);
                }
            }
        }

        if ((this.cpuTotalOld == null && this.cpuIdleOld == null)
            || (this.cpuTotalOld == cpuTotal && this.cpuIdleOld == cpuIdle)
        ) {
            this.cpuTotalOld = cpuTotal - 1;
            this.cpuIdleOld = cpuIdle - 1;
        }

        let diffCpuTotal = cpuTotal - this.cpuTotalOld;
        let diffCpuIdle = cpuIdle - this.cpuIdleOld;
        let cpuValue = Math.round(100 * (diffCpuTotal - diffCpuIdle) / diffCpuTotal);

        this.cpuTotalOld = cpuTotal;
        this.cpuIdleOld = cpuIdle;

        this.data.val = cpuValue.toString();
    }
}

var MemModule = class MemModule extends BaseModule {
    updateData() {
        // Код взят и немного доработан из расширения CpuMemInfo@xesnet.fr

        let memTotal, memFree, memBuffers, memCached;
        let fileMeminfo = GLib.file_get_contents('/proc/meminfo');
        let linesMeminfo = ('' + fileMeminfo[1]).split('\n');

        for (let i = 0; i < linesMeminfo.length; i++) {
            let values;

            if (linesMeminfo[i].match(/^MemTotal/)) {
                values = linesMeminfo[i].match(/^MemTotal:\s*([^ ]*)\s*([^ ]*)$/);
                memTotal = values[1];
            } else if (linesMeminfo[i].match(/^MemFree/)) {
                values = linesMeminfo[i].match(/^MemFree:\s*([^ ]*)\s*([^ ]*)$/);
                memFree = values[1];
            } else if (linesMeminfo[i].match(/^Buffers/)) {
                values = linesMeminfo[i].match(/^Buffers:\s*([^ ]*)\s*([^ ]*)$/);
                memBuffers = values[1];
            } else if (linesMeminfo[i].match(/^Cached/)) {
                values = linesMeminfo[i].match(/^Cached:\s*([^ ]*)\s*([^ ]*)$/);
                memCached = values[1];
            }
        }

        let memUsed = memTotal - memFree - memBuffers - memCached;

        this.data.val = Math.round(memUsed / memTotal * 100).toString();
    }
}
