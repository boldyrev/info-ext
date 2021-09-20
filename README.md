# info-ext
Расширение gnome-shell для отображения текстовой информации в тулбаре Gnome.
Выглядит это вот так:

$72.6 | Free: 196G | CPU: 6% | MEM: 12%

## Установка
1. Клонировать этот репозиторий в `~/.local/share/gnome-shell/extensions`
2. Включить расширение в `gnome-tweaks` или с помощью расширения браузера, например для Firefox [GNOME Shell integration](https://addons.mozilla.org/en-US/firefox/addon/gnome-shell-integration/)

## Добавление своего модуля
Расширение сделано по модульному принципу. Каждый модуль отвечает за вывод одного блока.

Для добавления своего модуля нужно:
1. Добавить новый класс в `modules.js`, который наследуется от `BaseModule` и реализовать метод `updateData`.
2. В `extension.js` -> `_init` -> `this._modules` добавить описание своего модуля:
```js
    this._modules = [
        ...
        new Modules.CpuModule({
            'label': 'CPU:',
            'val': '',
            'units': '%'
        }, SECOND),
    ];
```
