"""Author the near-camera equipment as actual 3D geometry. Blender 4.3+.
The review image is an offline asset render, NOT a Unity gameplay screenshot.
"""
import bpy, math, random, pathlib, sys
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'Assets/Reviry/Resources/Equipment'
REVIEW=ROOT/'ArtReview'
SOURCE=ROOT/'ArtSource'
SOURCE.mkdir(exist_ok=True)
OUT.mkdir(parents=True,exist_ok=True);REVIEW.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
random.seed(131)

def material(name,color,metal=0,rough=.4):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
carbon=material('Carbon',(.018,.026,.026),.45,.25)
black=material('ReelHousing',(.028,.039,.041),.65,.22)
metal=material('BrushedAluminium',(.40,.47,.48),.94,.23)
chrome=material('PolishedRims',(.65,.70,.69),.98,.13)
gold=material('ChampagneMetal',(.47,.36,.19),.85,.26)
rubber=material('Rubber',(.014,.018,.017),0,.7)
line=material('WoundMonofilament',(.35,.38,.22),.22,.4)
cork=material('Cork',(.48,.34,.18),0,.86)
# Multiscale cork relief and flecking. Retain the procedural material in .blend.
n=cork.node_tree.nodes;l=cork.node_tree.links;p=n.get('Principled BSDF');tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=150;tex.inputs['Detail'].default_value=3;tex.inputs['Roughness'].default_value=.8;ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.28;ramp.color_ramp.elements[0].color=(.10,.055,.018,1);ramp.color_ramp.elements[1].position=.73;ramp.color_ramp.elements[1].color=(.58,.40,.19,1);l.new(tex.outputs['Fac'],ramp.inputs['Fac']);l.new(ramp.outputs['Color'],p.inputs['Base Color']);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.3;bump.inputs['Distance'].default_value=.0008;l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
# Carbon-fibre weave under a clear coat.
n=carbon.node_tree.nodes;l=carbon.node_tree.links;p=n.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.45;p.inputs['Coat Roughness'].default_value=.18;tex=n.new('ShaderNodeTexChecker');tex.inputs['Scale'].default_value=240;tex.inputs['Color1'].default_value=(.009,.014,.015,1);tex.inputs['Color2'].default_value=(.028,.037,.038,1);l.new(tex.outputs['Color'],p.inputs['Base Color']);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.00006;l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])

root=bpy.data.objects.new('RodAndReel',None);bpy.context.collection.objects.link(root)
rod=bpy.data.objects.new('Rod',None);bpy.context.collection.objects.link(rod);rod.parent=root
reel=bpy.data.objects.new('Reel',None);bpy.context.collection.objects.link(reel);reel.parent=rod

def finish(o,name,mat,parent=rod,bevel=0):
 o.name=name;o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 if parent:o.parent=parent
 if bevel:
  mod=o.modifiers.new('Manufactured edge fillet','BEVEL');mod.width=bevel;mod.segments=3
  mod=o.modifiers.new('Weighted edge normals','WEIGHTED_NORMAL')
 return o

def cyl(name,r,depth,pos,mat,parent=rod,rotation=None,vertices=64,bevel=.0005):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=pos);o=finish(bpy.context.object,name,mat,parent,bevel)
 if rotation:o.rotation_euler=rotation
 return o

def sphere(name,pos,scale,mat,parent=rod):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=pos);o=finish(bpy.context.object,name,mat,parent);o.scale=scale;return o

def torus(name,r,t,pos,mat,parent=rod,rotation=None):
 bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=10,location=pos,major_radius=r,minor_radius=t);o=finish(bpy.context.object,name,mat,parent)
 if rotation:o.rotation_euler=rotation
 return o

def curve(name,points,r,mat,parent=rod):
 data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=16;data.bevel_depth=r;data.bevel_resolution=3;spline=data.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
 for b,p in zip(spline.bezier_points,points):b.co=p;b.handle_left_type=b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.data.materials.append(mat);o.parent=parent;return o

def beam(name,a,b,r,mat,parent=rod):
 mid=(Vector(a)+Vector(b))*.5;o=cyl(name,r,(Vector(a)-Vector(b)).length,mid,mat,parent,bevel=.0002);o.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler();return o

# 2.7 m tapered blank. Z is the rod axis in the authoring scene.
for i,(a,b,r0,r1) in enumerate([(0,.46,.015,.014),(.46,1.32,.0095,.0058),(1.32,2.70,.0058,.0017)]):
 bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=r0,radius2=r1,depth=b-a,location=(0,0,(a+b)/2));finish(bpy.context.object,'TaperedBlank_%02d'%i,carbon,rod,.0002)
# Rear and foregrips, turned reel-seat hardware.
for z,length,r in [(.12,.28,.018),(.54,.11,.0175)]:
 cyl('Turned cork grip',r,length,(0,0,z),cork)
 for offset in [-length/2,length/2]:torus('Grip finishing ring',r,.001,(0,0,z+offset),gold)
for z,r,h in [(-.027,.018,.025),(.30,.016,.10),(.385,.018,.025),(.435,.016,.065),(.477,.017,.008)]:cyl('Reel seat / locking collar',r,h,(0,0,z),rubber if z==-.027 else black)
for z in [.365,.375,.385,.395]:torus('Knurled locking detail',.0182,.00065,(0,0,z),metal)
# Real guide rings, ceramic inserts, feet and whipping.
for i,z in enumerate([.70,.98,1.28,1.61,1.94,2.24,2.50,2.69]):
 radius=.023*(1-i*.092);offset=.017+(1-i/8)*.025
 for dz in [-.025,.025]:beam('Guide foot',(0,0,z+dz),(0,-offset,z),.0009,metal)
 torus('Guide stainless frame',radius,.0011,(0,-offset,z),metal,rotation=(math.pi/2,0,0))
 torus('Ceramic insert',radius-.0017,.0011,(0,-offset,z),rubber,rotation=(math.pi/2,0,0))
 for dz in [-.033,-.03,-.027,.027,.03,.033]:torus('Thread whipping',max(.0025,.009-z*.0027),.00035,(0,0,z+dz),black)
# Reel hanging beneath the seat. Body geometry is articulated separately.
beam('Reel stem',(0,-.008,.37),(0,-.092,.34),.008,black,reel)
sphere('Foot clamp',(0,-.015,.37),(.014,.013,.075),black,reel)
sphere('Sculpted gearbox',(0,-.11,.31),(.034,.038,.055),black,reel)
sphere('Gearbox inset',(0,-.139,.30),(.029,.007,.042),metal,reel)
# Main spool rotates on an axis parallel to the rod.
cyl('Rotor cup',.046,.040,(0,-.111,.363),black,reel)
for z in [.347,.358,.378,.388]:torus('Rotor alloy rim',.045,.002,(0,-.111,z),chrome,reel)
cyl('Spool arbor',.033,.055,(0,-.111,.41),gold,reel)
cyl('Line backing',.041,.041,(0,-.111,.412),line,reel,vertices=96)
for i in range(72):torus('Individual line winding',.0412,.00026,(0,-.111,.392+i*.00056),line,reel)
for z in [.385,.44]:
 cyl('Machined spool lip',.045,.004,(0,-.111,z),chrome,reel,vertices=96,bevel=.0008)
 torus('Spool lip fine trim',.043,.0008,(0,-.111,z+.0025),gold,reel)
cyl('Front drag cap',.026,.012,(0,-.111,.452),black,reel)
for i in range(40):
 a=i*math.tau/40;sphere('Drag cap knurl',(.025*math.cos(a),-.111+.025*math.sin(a),.452),(.0015,.0015,.005),rubber,reel)
cyl('Drag cap medallion',.016,.0015,(0,-.111,.459),metal,reel)
# Bail wire and line roller, both real curved metal geometry.
points=[]
for i in range(17):
 a=math.pi*i/16;points.append((math.cos(a)*.057,-.111+math.sin(a)*.065,.386+math.sin(a)*.065))
curve('Bail wire',points,.0017,chrome,reel)
for x in [-.054,.054]:sphere('Bail arm',(x,-.109,.383),(.011,.013,.016),black,reel)
cyl('Line roller',.006,.016,(.052,-.11,.395),chrome,reel,rotation=(0,math.pi/2,0),vertices=32)
# Handle pivot, curved crank and machined bearing collars.
handle=bpy.data.objects.new('ReelHandle',None);bpy.context.collection.objects.link(handle);handle.parent=reel
curve('Forged crank',[(-.027,-.13,.3),(-.053,-.137,.3),(-.07,-.145,.33),(-.092,-.145,.34)],.005,metal,handle)
for x in [-.034,-.04]:cyl('Handle bearing',.010,.006,(x,-.13,.3),chrome,handle,rotation=(0,math.pi/2,0))
sphere('Soft touch handle knob',(-.098,-.145,.34),(.013,.014,.027),rubber,handle)
for z in [.325,.355]:torus('Knob seam',.012,.00035,(-.098,-.145,z),black,handle)
# Recessed fasteners keep the silhouette physically assembled.
for pos in [(.029,-.119,.30),(-.029,-.119,.30),(0,-.15,.325),(0,-.15,.285)]:
 cyl('Housing screw',.0028,.0018,pos,chrome,reel,rotation=(math.pi/2,0,0),vertices=24)
# Explicit animation / attachment markers for the future Unity prefab.
for name,pos in [('RodTip',(0,-.019,2.7)),('GripPoint',(0,0,.12)),('LineRoller',(.052,-.11,.395))]:
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=rod;o.location=pos
# Put the crank origin at its real bearing while preserving child transforms.
for child in list(handle.children):
 child.location -= Vector((-.027,-.13,.3))
handle.location=(-.027,-.13,.3)
# Authoring file stays outside Assets so Unity does not auto-import .blend.
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'RodAndReel.blend'),compress=True)
# Convert curves and apply manufacturing bevels for a self-contained FBX.
for o in list(bpy.context.scene.objects):
 if o.type=='CURVE':bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
bpy.ops.export_scene.fbx(filepath=str(OUT/'RodAndReel.fbx'),object_types={'MESH','EMPTY'},apply_unit_scale=True,axis_forward='-Z',axis_up='Y',use_mesh_modifiers=True,add_leaf_bones=False,bake_anim=False,path_mode='STRIP')
# This is a neutral studio review of the authored asset, not a game scene.
world=bpy.data.worlds.new('Studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.19,.22,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45;bpy.context.scene.world=world
for name,pos,power,size in [('Large softbox',(-.5,-.7,.9),6,.6),('Edge softbox',(.35,.1,.75),8,.4),('Front fill',(.5,-.6,.2),4,.45)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=pos;obj.rotation_euler=(Vector((0,-.08,.39))-obj.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('Asset review camera');cam=bpy.data.objects.new('Asset review camera',camdata);bpy.context.collection.objects.link(cam);cam.location=(.55,-.88,.71);target=Vector((0,-.075,.34));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.lens=55;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=128;scene.cycles.use_denoising=False;scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(REVIEW/'RodAndReel-offline-review.png');scene.view_settings.view_transform='AgX';scene.render.film_transparent=False
bpy.ops.render.render(write_still=True)
print('Authored FBX and offline asset review; Unity import NOT tested.',flush=True)
