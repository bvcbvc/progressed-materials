const open = new Vec2();
const back = new Vec2();

//Editable stuff for custom laser.
//4 colors from outside in. Normal meltdown laser has trasnparrency 55 -> aa -> ff (no transparrency) -> ff(no transparrency)
var colors = [Color.valueOf("a3570055"), Color.valueOf("bf6804aa"), Color.valueOf("db7909"), Color.valueOf("f08913")];
var length = 32;
const burnRadius = 36;

//Stuff you probably shouldn't edit.
//Width of each section of the beam from thickest to thinnest
var tscales = [1, 0.7, 0.5, 0.2];
//Overall width of each color
var strokes = [burnRadius/2, burnRadius/2.5, burnRadius/3, burnRadius/3.5];
//Determines how far back each section in the start should be pulled
var pullscales = [1, 1.12, 1.15, 1.17];
//Determines how far each section of the end should extend past the main thickest section
var lenscales = [1, 1.3, 1.6, 1.9];

var tmpColor = new Color();
const vec = new Vec2();

const magmaPool = extend(BasicBulletType, {
  update(b){
    if(b != null){
      if(b.getOwner().target != null){
        var target = Angles.angle(b.x, b.y, b.getOwner().target.getX(), b.getOwner().target.getY());
        b.rot(Mathf.slerpDelta(b.rot(), target, 0.15));
      }
      
      if(b.timer.get(1, 5)){
        Damage.damage(b.getTeam(), b.x, b.y, burnRadius, this.damage, true);
      }
      
      Puddle.deposit(Vars.world.tileWorld(b.x, b.y), Liquids.slag, 100000);
      Puddle.deposit(Vars.world.tileWorld(b.x, b.y), Liquids.oil, 99000);
    }
  },
  draw(b){
    if(b != null){
      //middle
      Draw.blend(Blending.additive);
      Draw.color(Color.valueOf("f08913"));
      Draw.alpha(b.fout());
      Fill.circle(b.x, b.y, burnRadius);
      Draw.blend();
      Draw.color();
      
      //ring
      Draw.color(Color.valueOf("a35700"));
      Draw.alpha(b.fout());
      Lines.stroke(1);
      Lines.circle(b.x, b.y, burnRadius);
      
      //"fountain" of lava
      Draw.blend(Blending.additive);
      for(s = 0; s < 4; s++){
        Draw.color(tmpColor.set(colors[s]).mul(1.0 + Mathf.absin(Time.time() + b.id, 1.0, 0.3)));
        Draw.alpha(b.fout());
        for(i = 0; i < 4; i++){
          var baseLen = (length + (Mathf.absin(b.getOwner().getBulletLife()/((i+1)*2.5) + b.id, 0.8, 1.5)*(length/1.5))) * b.fout();
          Tmp.v1.trns(90, (pullscales[i] - 1.0) * 55.0);
          Lines.stroke(4 * strokes[s] * tscales[i]);
          Lines.lineAngle(b.x, b.y, 90, baseLen * b.fout() * lenscales[i], CapStyle.none);
        }
      }
      Draw.blend();
      Draw.color();
      Draw.reset();
    }
  }
});

magmaPool.speed = 2;
magmaPool.lifetime = 16;
magmaPool.damage = 75;
magmaPool.collides = false;
magmaPool.collidesTiles = false;
magmaPool.hitEffect = Fx.fireballsmoke;
magmaPool.despawnEffect = Fx.none;
magmaPool.shootEffect = Fx.none;
magmaPool.smokeEffect = Fx.none;

//Got some help from EoD for the turning LaserTurret into PowerTurret part
const lavaRiser = extendContent(PowerTurret, "eruptor-ii", {});

lavaRiser.shootType = magmaPool;
lavaRiser.shootDuration = 240;
lavaRiser.COA = 1.5;
lavaRiser.firingMoveFract = 0.8;
lavaRiser.shootEffect = Fx.none;
lavaRiser.smokeEffect = Fx.none;
lavaRiser.ammoUseEffect = Fx.none;
lavaRiser.restitution = 0.01;

lavaRiser.cells = [];
lavaRiser.cellHeats = [];
lavaRiser.capsA = [];
lavaRiser.capsB = [];

lavaRiser.buildType = () => {
	var magmaEntity = extendContent(PowerTurret.PowerTurretBuild, lavaRiser, {
		setBullet(a){
			this._bullet = a;
		},
		
		getBullet(){
			return this._bullet;
		},
		
		setBulletLife(a){
			this._bulletlife = a;
		},
    
		getBulletLife(){
			return this._bulletlife;
		},
    
    setCellOpenAmount(a){
      this._cellOpenAmount = a;
    },
		
    getCellOpenAmount(){
      return this._cellOpenAmount;
    },
    
    load(){
      this.super$load();
      
      for(i = 0; i < 2; i++){
        this.cells[i] = Core.atlas.find(this.name + "-cells-" + i);
        this.cellHeats[i] = Core.atlas.find(this.name + "-cells-heat-" + i);
      }
      for(i = 0; i < 4; i++){
        this.capsA[i] = Core.atlas.find(this.name + "-caps-0-" + i);
        this.capsB[i] = Core.atlas.find(this.name + "-caps-1-" + i);
      }
    },
    draw(){
      this.super$draw();
      
      
      back.trns(tile.bc().rotation-90, 0, 0);
      
      //Bottom Layer Cells
      Draw.rect(this.cells[0], tile.bc().x + back.x, tile.bc().y + back.y, tile.bc().rotation-90);
      
      if(tile.bc().heat > 0){
        Draw.blend(Blending.additive);
        Draw.color(Color.valueOf("f08913"), tile.bc().heat);
        Draw.rect(this.cellHeats[0], tile.bc().x + back.x, tile.bc().y + back.y, tile.bc().rotation-90);
        Draw.blend();
        Draw.color();
      }
      
      //sw
      open.trns(tile.bc().rotation-90, 0 - tile.bc().getCellOpenAmount(), -tile.bc().getCellOpenAmount());
      Draw.rect(this.capsA[0], tile.bc().x + open.x, tile.bc().y + open.y, tile.bc().rotation-90);
      
      //se
      open.trns(tile.bc().rotation-90, 0 + tile.bc().getCellOpenAmount(), -tile.bc().getCellOpenAmount());
      Draw.rect(this.capsA[1], tile.bc().x + open.x, tile.bc().y + open.y, tile.bc().rotation-90);
      
      //nw
      open.trns(tile.bc().rotation-90, 0 - tile.bc().getCellOpenAmount(), tile.bc().getCellOpenAmount());
      Draw.rect(this.capsA[2], tile.bc().x + open.x, tile.bc().y + open.y, tile.bc().rotation-90);
      
      //nw
      open.trns(tile.bc().rotation-90, 0 + tile.bc().getCellOpenAmount(), tile.bc().getCellOpenAmount());
      Draw.rect(this.capsA[3], tile.bc().x + open.x, tile.bc().y + open.y, tile.bc().rotation-90);
      
      
      //Top Layer Cells
      Draw.rect(this.cells[1], tile.bc().x + back.x, tile.bc().y + back.y, tile.bc().rotation-90);
      
      if(tile.bc().heat > 0){
        Draw.blend(Blending.additive);
        Draw.color(Color.valueOf("f08913"), tile.bc().heat);
        Draw.rect(this.cellHeats[1], tile.bc().x + back.x, tile.bc().y + back.y, tile.bc().rotation-90);
        Draw.blend();
        Draw.color();
      }
      
      //sw
      open.trns(tile.bc().rotation-90, 0 - tile.bc().getCellOpenAmount(), -tile.bc().getCellOpenAmount());
      Draw.rect(this.capsB[0], tile.bc().x + open.x, tile.bc().y + open.y, tile.bc().rotation-90);
      
      //se
      open.trns(tile.bc().rotation-90, 0 + tile.bc().getCellOpenAmount(), -tile.bc().getCellOpenAmount());
      Draw.rect(this.capsB[1], tile.bc().x + open.x, tile.bc().y + open.y, tile.bc().rotation-90);
      
      //nw
      open.trns(tile.bc().rotation-90, 0 - tile.bc().getCellOpenAmount(), tile.bc().getCellOpenAmount());
      Draw.rect(this.capsB[2], tile.bc().x + open.x, tile.bc().y + open.y, tile.bc().rotation-90);
      
      //nw
      open.trns(tile.bc().rotation-90, 0 + tile.bc().getCellOpenAmount(), tile.bc().getCellOpenAmount());
      Draw.rect(this.capsB[3], tile.bc().x + open.x, tile.bc().y + open.y, tile.bc().rotation-90);
    },
    icons(){
      return [
        Core.atlas.find("block-4"),
        Core.atlas.find("definitely-not-advance-content-eruptor-ii-icon")
      ];
    },
    setStats(){
      this.super$setStats();
      
      this.stats.remove(BlockStat.inaccuracy);
      this.stats.remove(BlockStat.damage);
      //damages every 5 ticks
      this.stats.add(BlockStat.damage, this.shootType.damage * 60 / 5, StatUnit.perSecond);
    },
    updateTile(){
      this.super$updateTile();
      
      if(tile.bc().getBulletLife() <= 0 && tile.bc().getBullet() == null){
        tile.bc().setCellOpenAmount(Mathf.lerpDelta(tile.bc().getCellOpenAmount(), 0, this.restitution));
      }
      
      if(tile.bc().getBulletLife() > 0 && tile.bc().getBullet() != null){
        var entBullet = tile.bc().getBullet();
        
        if(tile.bc().getBulletLife() >= this.shootDuration){
          entBullet.set(tile.tile.bc().target.getX(), tile.tile.bc().target.getY());
        }
        
        this.tr.trns(tile.bc().rotation, this.size * Vars.tilesize / 2, 0);
        entBullet.time(0);
        tile.bc().heat = 1;
        tile.bc().setCellOpenAmount(this.COA * 1+(Mathf.absin(tile.bc().getBulletLife()/3, 0.8, 1.5)/3));
        tile.bc().setBulletLife(tile.bc().getBulletLife() - Time.delta());
        if(tile.bc().getBulletLife() <= 0){
          tile.bc().setBullet(null);
        }
      }
    },
    updateShooting(tile){
      if(tile.bc().getBulletLife() > 0 && tile.bc().getBullet() != null){
        return;
      };
      
      if(tile.bc().reloadTime >= this.reloadTime){
        type = this.peekAmmo(tile);
        
        this.shoot(tile, type);
        
        tile.bc().reloadTime = 0;
      }
      else{
        liquid = tile.bc().liquids.current();
        maxUsed = this.consumes.get(ConsumeType.liquid).amount;
        
        used = this.basereloadTimeSpeed(tile) * (tile.isEnemyCheat() ? maxUsed : Math.min(tile.bc().liquids.get(liquid), maxUsed * Time.delta())) * liquid.heatCapacity * this.coolantMultiplier;
        tile.bc().reloadTime += Math.max(used, 1 * Time.delta()) * tile.bc().power.status;
        tile.bc().liquids.remove(liquid, used);
        
        if(Mathf.chance(0.06 * used)){
          this.coolEffect.at(tile.drawx() + Mathf.range(this.size * Vars.tilesize / 2), tile.drawy() + Mathf.range(this.size * Vars.tilesize / 2), 0);
        }
      }
    },
    bullet(tile, type, angle){
      bullet = Bullet.create(type, entity, tile.getTeam(), tile.drawx() + this.tr.x, tile.drawy() + this.tr.y, angle);
      
      tile.bc().setBullet(bullet);
      tile.bc().setBulletLife(this.shootDuration);
    },
    turnToTarget(tile, targetRot){
      tile.bc().rotation = Angles.moveToward(tile.bc().rotation, targetRot, this.rotateSpeed * tile.bc().delta() * (tile.bc().getBulletLife() > 0 ? this.firingMoveFract : 1));
    },
    shouldActiveSound(tile){
      return tile.bc().getBulletLife() > 0 && tile.bc().getBullet() != null;
    }
	});
	
	magmaEntity.setBullet(null);
	magmaEntity.setBulletLife(0);
  magmaEntity.setCellOpenAmount(0);
	
	return magmaEntity;
};