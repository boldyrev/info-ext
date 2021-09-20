const Lang = imports.lang;
const { GObject, Clutter, St, Soup, GLib } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const CurrentExtension = imports.misc.extensionUtils.getCurrentExtension();
const Modules = CurrentExtension.imports.modules;

const SECOND = 1;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;

const Info = GObject.registerClass(class Info extends PanelMenu.Button {
    _init() {
        super._init(0);

        // Список подключаемых модулей
        this._modules = [
            new Modules.CurrencyModule({
                'label': '$',
                'val': '',
                'units': ''
            }, HOUR),
            new Modules.FreeSpaceModule({
                'label': 'Free:',
                'val': '',
                'units': ''
            }, MINUTE),
            new Modules.CpuModule({
                'label': 'CPU:',
                'val': '',
                'units': '%'
            }, SECOND),
            new Modules.MemModule({
                'label': 'MEM:',
                'val': '',
                'units': '%'
            }, SECOND),
        ];

        let box = new St.BoxLayout({ x_align: St.Align.END });
        this.label = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: this.getLabelText()
        });
        box.add_actor(this.label);
        this.add_child(box);

        // Интерфейс обновляем каждую секунду, данные обновляются в каждом модуле по своему таймауту
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
            SECOND,
            () => {
                this.updateUI();
                return true;
            });
    }

    getLabelText() {
        let textArr = [];
        for (const m of this._modules) {
            textArr.push(`${m.data.label} ${m.data.val} ${m.data.units}`.trim());
        }

        return textArr.join(' | ')
    }

    updateUI() {
        this.label.set_text(this.getLabelText());
    }

    destroy() {
        super.destroy();

        for (const m of this._modules) {
            m.destroy();
        }

        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        this._info = new Info();
        Main.panel.addToStatusArea(this._uuid, this._info, 0, 'left');
    }

    disable() {
        this._info.destroy();
        this._info = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
