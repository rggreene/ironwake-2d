// District positions are in the same world units as the Bastion and combat AI.
const byId = id => document.getElementById(id);
const steel = '#74847d', amber = '#efc275', dark = '#344346';
const railStep = 150, apronRadius = 58;

export class DistrictOperation {
    constructor(scene, hooks) {
        this.hooks = hooks;
        this.site = new PIXI.Graphics();
        this.beacon = new PIXI.Graphics();
        scene.addChild(this.site, this.beacon);
        this.phase = 'approach';
        this.route = '';
        this.progress = 0;
        this.completed = false;
        this.blocked = false;
        this.pickupReserved = false;
        this.target = null;
        this.line = byId('mission-status');
        this.arrow = byId('mission-arrow');
    }

    choices(title, options) {
        this.blocked = true;
        const dialog = byId('mission-dialog');
        byId('mission-title').textContent = title;
        const buttons = options.map(([name, detail, act]) => {
            const button = document.createElement('button');
            button.textContent = name;
            const small = document.createElement('small');
            small.textContent = detail;
            button.append(small);
            button.onclick = () => {
                if (!this.blocked) return;
                dialog.classList.add('hidden');
                this.blocked = false;
                act();
            };
            return button;
        });
        byId('mission-choices').replaceChildren(...buttons);
        dialog.classList.remove('hidden');
        buttons[0].focus({preventScroll:true});
    }

    mark(x, y) {
        this.target = {x, y};
        this.beacon.clear().circle(x, y, 13).stroke({color:amber, width:2});
        this.beacon.rect(x-3, y-3, 6, 6).fill(amber);
    }

    chooseRoute(rail) {
        this.route = rail ? 'Rail Yard' : 'Salvage Depot';
        this.phase = 'job';
        const pilot = this.hooks.position();
        const x = pilot.x + (rail ? 100 : -110), y = pilot.y - 60;
        const art = this.site;
        if (rail) {
            for (let i = -40; i < railStep*2+50; i+=12)
                art.rect(x+i, y-13, 4, 26).fill(dark);
            for (const side of [-8, 8])
                art.rect(x-40, y+side, railStep*2+90, 2).fill(steel);
            for (let i = 0; i < 3; i++) {
                const sx = x + i*railStep;
                art.rect(sx-5,y+9,10,7).fill('#272e30');
                art.moveTo(sx,y+12).lineTo(sx+5,y+6).stroke({color:steel,width:2});
            }
        } else {
            art.circle(x,y,apronRadius).fill({color:steel,alpha:.13})
                .stroke({color:'#9d997e',width:2});
            for (const side of [-1,1]) {
                art.rect(x+side*42-5,y-34,10,64).fill(dark);
                art.rect(x+side*42-2,y-32,4,60).fill(steel);
            }
            art.rect(x-48,y-33,96,6).fill('#aa915c');
            for(let i=-40;i<40;i+=12)
                art.moveTo(x+i,y-33).lineTo(x+i+7,y-27).stroke({color:dark,width:2});
            art.rect(x-2,y-27,2,16).fill(steel).rect(x-12,y-11,22,11).fill('#84765c');
        }
        this.mark(x,y);
    }

    updateJob(dt) {
        const p = this.hooks.position();
        const t = this.target;
        const distance = Math.hypot(p.x-t.x,p.y-t.y);
        if (this.route === 'Rail Yard') {
            if (distance <= 20) {
                this.progress++;
                this.site.circle(t.x,t.y,5).fill('#9bbdaf');
                if (this.progress < 3) this.mark(t.x+railStep,t.y);
            }
            this.status('Track switches '+this.progress+'/3');
            this.completed = this.progress === 3;
        } else {
            if (distance <= apronRadius) this.progress = Math.min(30,this.progress+dt);
            this.status('Crane loading '+Math.floor(this.progress)+'/30s');
            this.completed = this.progress >= 30;
        }
        if (this.completed) {
            this.phase = 'waiting';
            this.clearMarker();
            this.status('');
            this.hooks.notice('FIELD JOB COMPLETE // BONUS PICKUP AVAILABLE');
        }
    }

    status(text) {
        if (this.line.textContent !== text) this.line.textContent = text;
        this.line.hidden = !text;
    }

    clearMarker() {
        this.target = null;
        this.beacon.clear();
        this.arrow.hidden = true;
    }

    guide(w,h) {
        if (!this.target) return;
        const p = this.hooks.position();
        const dx = (this.target.x-p.x)/w, dy = (this.target.y-p.y)/h;
        this.arrow.hidden = Math.abs(dx)<.46 && Math.abs(dy)<.44;
        if (this.arrow.hidden) return;
        // Keep navigation above the touch controls and below the top instruments.
        const scale = Math.min(.43/Math.abs(dx),.22/Math.abs(dy));
        this.arrow.style.left = (50+100*dx*scale)+'%';
        this.arrow.style.top = (50+100*dy*scale)+'%';
        const angle = Math.atan2(dy*innerHeight,dx*innerWidth);
        this.arrow.style.transform = 'translate(-50%,-50%) rotate('+angle+'rad)';
    }

    openRamp(final) {
        const ramp = this.hooks.pickup();
        this.mark(ramp.x,ramp.y);
        this.phase = final ? 'bonusRamp' : 'ramp';
        this.status('Board BEAST · reach ramp');
    }

    update(time,dt,w,h) {
        if (this.phase === 'approach' && time >= 300) {
            this.choices('Choose a field job', [
                ['Rail Yard','Cross three track switches in order.',()=>this.chooseRoute(true)],
                ['Salvage Depot','Hold the crane apron for 30 seconds total.',()=>this.chooseRoute(false)]
            ]);
            return;
        }
        if (!this.pickupReserved && time >= 840) {
            this.pickupReserved = true;
            this.hooks.notice('BEAST INBOUND // PICKUP AT 15:00');
        }
        if (this.phase === 'job') this.updateJob(dt);
        if ((this.phase === 'waiting' || this.phase === 'job') && time >= 900)
            this.openRamp(false);
        if (this.phase === 'hold') {
            this.status('BEAST returns in '+Math.max(0,Math.ceil(this.returnAt-time))+'s');
            if (time >= this.returnAt) this.openRamp(true);
        }
        this.guide(w,h);
        if (this.phase !== 'ramp' && this.phase !== 'bonusRamp') return;
        const p = this.hooks.position();
        if (Math.hypot(p.x-this.target.x,p.y-this.target.y)>22) return;
        const bonus = this.phase === 'bonusRamp';
        const options = [['Board BEAST',bonus ? 'Recover salvage and one blueprint component.' : 'Recover your salvage and finish this deployment.',()=>this.hooks.extract(bonus)]];
        if (this.completed && !bonus) options.push(['Stay 90 seconds','Survive and board the next pickup for one blueprint component.',()=>{
            this.hooks.leave();
            this.clearMarker();
            this.phase = 'hold';
            this.returnAt = time+90;
        }]);
        this.choices('Extraction ramp',options);
    }

    dispose() {
        this.site.destroy();
        this.beacon.destroy();
        this.status('');
        this.arrow.hidden = true;
        byId('mission-dialog').classList.add('hidden');
        byId('mission-choices').replaceChildren();
    }
}
