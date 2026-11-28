import assert from 'node:assert/strict';
import { DistrictOperation } from './district-v315.mjs';

// Run the shipped mission controller against a stationary pilot and a minimal scene.
class Element {
    classList = {add(){}, remove(){}};
    style = {};
    append() {}
    focus() {}
    replaceChildren(...children) { this.children = children; }
}
const elements = new Map();
globalThis.document = {
    getElementById(id) {
        if (!elements.has(id)) elements.set(id,new Element());
        return elements.get(id);
    },
    createElement: () => new Element()
};
class Graphics {
    clear(){return this} circle(){return this} rect(){return this} fill(){return this}
    moveTo(){return this} lineTo(){return this} stroke(){return this} destroy(){}
}
globalThis.PIXI = {Graphics};
globalThis.innerWidth = 800;
globalThis.innerHeight = 400;

for (const scenario of ['rail','depot','unfinished']) {
    const position = {x:0,y:0};
    let result, departures = 0;
    const op = new DistrictOperation({addChild(){}}, {
        position:()=>position, pickup:()=>({x:300,y:300}), leave:()=>departures++,
        extract: bonus=>{result = bonus}, notice(){}
    });
    const tick = (t,dt=.05)=>op.update(t,dt,400,200);
    const choose = index=>elements.get('mission-choices').children[index].onclick();
    const reach = ()=>Object.assign(position,op.target);
    tick(299);
    assert.equal(op.blocked,false);
    tick(300);
    assert.equal(op.blocked,true);
    choose(scenario === 'depot' ? 1 : 0);
    if (scenario === 'rail') {
        for(let i=1;i<=3;i++) {
            reach(); tick(310+i);
            assert.equal(op.progress,i);
        }
    } else if (scenario === 'depot') {
        reach(); tick(315,15);
        position.x+=100; tick(320,5);
        assert.equal(op.progress,15);
        reach(); tick(335,15);
    }
    assert.equal(op.completed,scenario !== 'unfinished');
    tick(840);
    assert.equal(op.pickupReserved,true);
    tick(900); reach(); tick(901);
    assert.equal(elements.get('mission-choices').children.length,op.completed?2:1);
    if (scenario === 'depot') {
        choose(1); assert.equal(departures,1);
        tick(990); assert.equal(op.phase,'hold');
        tick(991); reach(); tick(992);
    }
    assert.equal(result,undefined);
    choose(0);
    assert.equal(result,scenario === 'depot');
    op.dispose();
    assert.equal(elements.get('mission-status').hidden,true);
}
console.log('PASS district routes, cumulative crane dwell, incomplete job, ramps, bonus timing and cleanup');
