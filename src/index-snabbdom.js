import { init } from './lib/package/init'
import { classModule } from './lib/package/modules/class'
import { propsModule } from './lib/package/modules/props'
import { styleModule } from './lib/package/modules/style'
import { eventListenersModule } from './lib/package/modules/eventlisteners'
import { h } from './lib/package/h' // helper function for creating vnodes
function someFn() {
    console.log("someFn")
}
function anotherEventHandler() {
    console.log("anotherEventHandler")
}
window.onload = function () {
    var patch = init([ // Init patch function with chosen modules
        classModule, // makes it easy to toggle classes
        propsModule, // for setting properties on DOM elements
        styleModule, // handles styling on elements with support for animations
        eventListenersModule, // attaches event listeners
    ])
    var container = document.getElementById('root')
   
    var vnode = h('div#container.two.classes', { on: { click: someFn } }, [
        h('span', { style: { fontWeight: 'bold' } }, 'This is bold'),
        ' and this is just normal text',
        h('a', { props: { href: '/foo' } }, 'I\'ll take you places!')
    ])
    patch(container, vnode)
    var newVnode = h('div#container.two.classes', { on: { click: anotherEventHandler } }, [
        h('span', { style: { fontWeight: 'normal', fontStyle: 'italic' } }, 'This is now italic type'),
        ' and this is still just normal text',
        h('a', { props: { href: '/bar' } }, 'I\'ll take you places!')
    ])
    patch(vnode, newVnode)
};