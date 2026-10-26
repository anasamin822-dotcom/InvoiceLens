import {useEffect,useRef} from 'react';
import * as THREE from 'three';
export default function DocumentScene(){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=host.current;if(!el)return;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.innerWidth<650?1:1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,0,10);
  scene.add(new THREE.AmbientLight(0xb9c8ff,2));const key=new THREE.DirectionalLight(0xffffff,4);key.position.set(3,5,7);scene.add(key);const rim=new THREE.PointLight(0x6b78ff,35);rim.position.set(-3,1,2);scene.add(rim);const green=new THREE.PointLight(0xd2f786,15);green.position.set(3,-2,3);scene.add(green);
  const group=new THREE.Group();scene.add(group);group.rotation.set(-.12,-.28,-.14);
  const paper=new THREE.Mesh(new THREE.BoxGeometry(2.7,3.65,.14),new THREE.MeshPhysicalMaterial({color:0xf4f5ff,roughness:.28,metalness:.08,clearcoat:.5}));group.add(paper);
  const back=new THREE.Mesh(new THREE.BoxGeometry(2.7,3.65,.08),new THREE.MeshStandardMaterial({color:0x7584f6,roughness:.3}));back.position.set(-.24,-.04,-.19);back.rotation.z=.09;group.add(back);
  const lineMat=new THREE.MeshStandardMaterial({color:0xb7c0dd,roughness:.5});
  for(let i=0;i<8;i++){const width=i===0?1.1:i%3===0?1.7:2;const line=new THREE.Mesh(new THREE.BoxGeometry(width,i===0?.15:.055,.02),i===0?new THREE.MeshStandardMaterial({color:0x343e6c}):lineMat);line.position.set(i===0?-.46:0,1.25-i*.29,.09);group.add(line);}
  const box=new THREE.Mesh(new THREE.BoxGeometry(1.85,.38,.025),new THREE.MeshPhysicalMaterial({color:0xd4f798,transparent:true,opacity:.74,roughness:.3}));box.position.set(0,-1,.12);group.add(box);
  const lensGroup=new THREE.Group();lensGroup.position.set(.87,.1,1.06);lensGroup.rotation.set(.1,-.2,.2);group.add(lensGroup);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.79,.115,20,64),new THREE.MeshPhysicalMaterial({color:0x687bff,metalness:.75,roughness:.18,clearcoat:1}));lensGroup.add(ring);
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(.73,.73,.055,64),new THREE.MeshPhysicalMaterial({color:0x9caeff,transparent:true,opacity:.22,metalness:.1,roughness:.03,clearcoat:1}));glass.rotation.x=Math.PI/2;lensGroup.add(glass);
  const handle=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.8,8,16),new THREE.MeshStandardMaterial({color:0x3548ab,metalness:.5,roughness:.2}));handle.rotation.z=.7;handle.position.set(.72,-.9,0);lensGroup.add(handle);
  const tile=new THREE.Group();tile.position.set(-1.6,-1.1,.8);tile.rotation.z=.15;group.add(tile);
  const tileMesh=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.2),new THREE.MeshPhysicalMaterial({color:0xd9f695,roughness:.2,clearcoat:1}));tile.add(tileMesh);
  for(const [x,y,angle,length]of [[-.15,-.02,.7,.23],[.09,.04,-.7,.48]]){const check=new THREE.Mesh(new THREE.BoxGeometry(.09,length,.05),new THREE.MeshStandardMaterial({color:0x3c5b27}));check.position.set(x,y,.13);check.rotation.z=angle;tile.add(check);}
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(2.7,.009,4,100),new THREE.MeshBasicMaterial({color:0x59678f,transparent:true,opacity:.4}));orbit.rotation.x=1.1;orbit.rotation.y=.3;scene.add(orbit);
  let active=true,frame=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const clock=new THREE.Clock();
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);};const obs=new ResizeObserver(resize);obs.observe(el);resize();
  const intersection=new IntersectionObserver(entries=>{active=entries[0].isIntersecting;});intersection.observe(el);
  function animate(){frame=requestAnimationFrame(animate);if(!active)return;const t=clock.getElapsedTime();if(!reduced){group.position.y=Math.sin(t*.8)*.12;group.rotation.y=-.28+Math.sin(t*.35)*.12;lensGroup.position.y=.1+Math.sin(t*.7)*.09;orbit.rotation.z=t*.025;}renderer.render(scene,camera);}animate();
  return()=>{cancelAnimationFrame(frame);obs.disconnect();intersection.disconnect();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className="document-scene" ref={host} aria-hidden="true"><div className="scene-halo"/></div>;
}
