import { Card } from '../card'
import { PaperScope, Point, Size } from 'paper'
// import { }

let card: Card;
let margin: paper.Size
let fontSize: number
let defaultWidth = 100
let defaultPos = new Point(100, 100)
// shoud be the same as in card.ts
let defaultBarHeight = 30

beforeEach(() => {
    const paper = new PaperScope()
    paper.install(global)
    const canvas = document.createElement('canvas')
    paper.setup(canvas)
    // use default margin (will likely later move to config)
    card = new Card(paper.project, defaultPos, defaultWidth)
    margin = card.margin
    fontSize = card.text.font.size
})

test('initialize card', () => {
    expect(card.box.bounds.width).toBe(defaultWidth)
    expect(card.bar.bounds.width).toBe(defaultWidth)
    expect(card.text.box.width).toBe(defaultWidth - (2 * margin.width))
    expect(card.position()).toStrictEqual(defaultPos)
    expect(card.size().height).toBe(fontSize + (2 * margin.height) + defaultBarHeight) 
})

test('insert text into card', () => {
    let str = "Hello World"
    card.input(str)
    expect(card.text.text()).toBe(str)
})

test('move card', () => {
    let newPos = new Point(200, 200)
    card.move(newPos)
    expect(card.position()).toStrictEqual(newPos)
    expect(card.text.box.topLeft.clone()).toStrictEqual(newPos.add(new Point(margin.width, margin.height)))
    newPos = new Point(0, 300)
    card.move(newPos)
    expect(card.position()).toStrictEqual(newPos)
    expect(card.text.box.topLeft.clone()).toStrictEqual(newPos.add(new Point(margin.width, margin.height)))
})

test('translate card', () => {
    card.translate(defaultPos)
    expect(card.position()).toStrictEqual(defaultPos.multiply(2))
})

test('resize card', () => {
    card.resize(50)
    expect(card.position()).toStrictEqual(defaultPos)
    expect(card.size()).toStrictEqual(new Size(50, fontSize + (2 * margin.height) + defaultBarHeight))
    card.text.insert("Sed ut perspiciatis")
    // card.text.insert("unde omnis iste natus error sit")
    // expect(card.text.string()).toBe("Hello")
    // expect(card.size()).toStrictEqual(new Size(50, (2 * fontSize) + (2 * margin.height) + defaultBarHeight))
    // card.resize(200)
    // expect(card.position()).toStrictEqual(defaultPos)
    // expect(card.size()).toStrictEqual(new Size(200, fontSize + (2 * margin.height) + defaultBarHeight))
})

test('activate and focus card', () => {
    expect(card.box.visible).toBe(false)
    card.activate()
    // expect(card.box.)
})