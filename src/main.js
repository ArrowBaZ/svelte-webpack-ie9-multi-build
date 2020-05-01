import App from './App.svelte'

function replaceContainer (Component, options) {
    const frag = document.createDocumentFragment()
    const component = new Component(Object.assign({}, options, { target: frag }))

    const target = document.querySelector('.my-custom-element')
    if (!target) {
        return
    }

    target.insertBefore(frag, target.firstChild)

    return component
}

const app = replaceContainer(App, {
    dev: process.env.NODE_ENV === 'development',
    props: {
        // we'll learn about props later
        name: 'world'
    }
})

export default app

