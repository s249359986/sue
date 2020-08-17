import _ from 'lodash'
console.log('____',_)
const _DEFAUL_TOPTION = {
    template: "",
    data : () => {
    },
    methods:{},
    watch:{},
}

function SueComponent(wueComponentProps = {}) {  
    
    const {
        template = "",
        data = () => {
        },
        methods = {},
        watch = {},
    } = this.$options = _.merge(_DEFAUL_TOPTION,wueComponentProps);
    callHook(this,"created");
    this.$watch = watch;
    this.$watchers = {};
    this.$methods = methods;
    this.$data = data() || {};
    bindVueProperties(this, data() || {});
    this.observe(this.$data);
    this.observe(this);
    bindVueProperties(this, this.$methods);
    this.$template = htmlStringToElement(template);
    this.$sueDomNode = this.compile();    
    // callHook(this,"mounted");
    if(this.$options.el){
        this.$mount(this.$options.el,this)
    }
}

SueComponent.prototype.observe = function (data, path = "") {
    const self = this;
    if (!data || Object.prototype.toString.call(data) !== "[object Object]") {
        return;
    }
    const keys = Object.keys(this.$data);
    for (let key of keys) {
        let value = data[key];
        //这里的path是用来记录property的层级路径的，比如 {a: {b : 1}}中b的path是a.b
        const currentPath = path + key;
        if (typeof value === "object") {
            //如果是Object，则递归进入下一层结构构件代理
            self.observe(value, currentPath + ". ");
            data[key] = new Proxy(value, {
                set(target, property, value, receiver) {
                    if (!Reflect.set(target, property, value, receiver)) {
                        return false;
                    }
                    const keyPath = currentPath + "." + property;
                    //属性改变时会通知该key对应的watcher进行更新，并执行watch里的相应key的回调
                    updateWatcher(self.$watchers[keyPath], value);
                    self.$watch[keyPath] && self.$watch[keyPath](value);
                    return true;
                },
                get(target, property, receiver) {
                    return target[property];
                }
            });
        } else {
            Object.defineProperty(data, key, {
                enumerable: true,
                configurable: false,
                get() {
                    return value;
                },
                set(newVal) {
                    value = newVal;
                    self.$watch[currentPath] && self.$watch[currentPath](newVal);
                    updateWatcher(self.$watchers[currentPath], newVal);
                }
            });
        }
    }
};

SueComponent.prototype.compile = function () {    
    const self = this;
    const el = self.$template;
    const data = self;      //因为要把data绑在component的实例上，所以这里的data是this
    if (!(el instanceof HTMLElement)) {
        throw new TypeError("The first argument must be an HTMLElement instance");
    }
    const fragment = document.createDocumentFragment();
    let child = el.firstChild;
    while (child) {
        fragment.appendChild(child);
        child = el.firstChild;
    }
    const reg = /\{\{(.*?)\}\}/g;
    const replace = (parentNode) => {  
        const children = parentNode.childNodes;
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            const nodeType = node.nodeType;
            console.log("nodeType",nodeType)    
            console.log("Node",Node)          
            const text = node.textContent;
            if (nodeType === Node.TEXT_NODE && reg.test(text)) {
                node.textContent = text.replace(reg, (matched, placeholder) => {
                    let pathArray = [];
                    const textContent = placeholder.split(".").reduce((prev, property) => {
                        pathArray.push(property);
                        return prev[property];
                    }, data);
                    const path = pathArray.join(".");
                    self.$watchers[path] = self.$watchers[path] || [];
                    self.$watchers[path].push(new Watcher(self, node, "textContent", text));
                    return textContent;
                });
            }

            if (nodeType === Node.ELEMENT_NODE) {
                const attrs = node.attributes;
                for (let i = 0; i < attrs.length; i++) {
                    const attr = attrs[i];
                    const attrName = attr.name;
                    const attrValue = attr.value;
                    self.$watchers[attrValue] = self.$watchers[attrValue] || [];
                    if (attrName === "v-model") {
                        node.addEventListener("input", (e) => {
                            const inputVal = e.target.value;
                            const keys = attrValue.split(".");
                            const lastKey = keys.splice(keys.length - 1)[0];
                            const targetKey = keys.reduce((prev, property) => {
                                return prev[property];
                            }, data);
                            targetKey[lastKey] = inputVal;
                        });
                    }
                    if (attrName === ":bind" || attrName === "v-model") {
                        node.value = attrValue.split(".").reduce((prev, property) => {
                            return prev[property];
                        }, data);
                        self.$watchers[attrValue].push(new Watcher(self, node, "value"));
                        node.removeAttribute(attrName);
                    } else if (attrName.startsWith(":")) {
                        const attributeName = attrName.slice(1);
                        const attributeValue = attrValue.split(".").reduce((prev, property) => {
                            return prev[property];
                        }, data);
                        node.setAttribute(attributeName, attributeValue);
                        self.$watchers[attrValue].push(new Watcher(self, node, attributeName));
                        node.removeAttribute(attrName);
                    } else if (attrName.startsWith("@")) {
                        const event = attrName.slice(1);
                        const cb = attrValue;
                        node.addEventListener(event, function () {
                            self.$methods[cb].call(self);
                        });
                        node.removeAttribute(attrName);
                    }
                }
            }

            if (node.childNodes && node.childNodes.length) {
                replace(node);
            }
        }
    };

    replace(fragment);
    el.appendChild(fragment);    
    return el;
};

SueComponent.prototype.$mount = function(el,vm){
    if (el === document.body || el === document.documentElement) {
        console.warn("Do not mount sue to <html> or <body> - mount to normal elements instead.")     
        return this
    }
    window.onload = ()=> {        
        document.getElementById(el).appendChild(vm.$sueDomNode)
    }
}

function htmlStringToElement(html = "") {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

function updateWatcher(watchers = [], value) {
    watchers.forEach(watcher => {
        watcher.update(value);
    });
}

function bindVueProperties(vueInstance, obj) {
    for (let key of Object.keys(obj)) {
        vueInstance[key] = obj[key];
    }
}


function callHook (vm, hook) {
    // #7573 disable dep collection when invoking lifecycle hooks
    // pushTarget()
    const handlersObj = vm.$options[hook]
    if (handlersObj) {
        let handlers = [handlersObj]        
      for (let i = 0, j = handlers.length; i < j; i++) {
        try {
          handlers[i].call(vm)
        } catch (e) {
          handleError(e, vm, `${hook} hook`)
          console.log(`${hook} hook err${e}`)
        }
      }
    }
    // if (vm._hasHookEvent) {
    //   vm.$emit('hook:' + hook)
    // }
    // popTarget()
}

function Watcher(data, node, attribute, template) {
    this.data = data;
    this.node = node;
    this.attribute = attribute;
    this.template = template;
}

Watcher.prototype.update = function (value) {
    const attribute = this.attribute;
    const data = this.data;
    const template = this.template;
    const reg = /\{\{(.*?)\}\}/g;
    if (attribute === "value") {
        this.node[attribute] = value;
    } else if (attribute === "innerText" || attribute === "innerHTML" || attribute === "textContent") {
        this.node[attribute] = template.replace(reg, (matched, placeholder) => {
            return placeholder.split(".").reduce((prev, property) => {
                return prev[property];
            }, data);
        });
    } else if (attribute === "style") {
        this.node.style.cssText = value;
    } else {
        this.node.setAttribute(attribute, value);
    }
};




export { SueComponent }