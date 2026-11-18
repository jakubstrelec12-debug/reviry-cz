using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.Build.Reporting;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
namespace Reviry.Editor
{
    [InitializeOnLoad]
    public static class ProjectSetup
    {
        const string Root="Assets/Reviry/Resources/Materials/";
        const string Scene="Assets/Reviry/Scenes/Vajgar.unity";
        static ProjectSetup(){EditorApplication.delayCall+=()=>{if(!Application.isBatchMode&&!File.Exists(Root+"VajgarURP.asset"))Prepare();};}
        [MenuItem("Reviry/Prepare Project")]
        public static void Prepare()
        {
            Directory.CreateDirectory(Root);AssetDatabase.Refresh();
            var renderer=AssetDatabase.LoadAssetAtPath<UniversalRendererData>(Root+"VajgarRenderer.asset");
            if(renderer==null){renderer=ScriptableObject.CreateInstance<UniversalRendererData>();AssetDatabase.CreateAsset(renderer,Root+"VajgarRenderer.asset");}
            var pipeline=AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(Root+"VajgarURP.asset");
            if(pipeline==null){pipeline=UniversalRenderPipelineAsset.Create(renderer);AssetDatabase.CreateAsset(pipeline,Root+"VajgarURP.asset");}
            pipeline.supportsCameraDepthTexture=true;pipeline.supportsCameraOpaqueTexture=true;pipeline.supportsHDR=true;pipeline.msaaSampleCount=4;pipeline.renderScale=1;pipeline.shadowDistance=75;pipeline.shadowCascadeCount=2;
            GraphicsSettings.defaultRenderPipeline=pipeline;QualitySettings.renderPipeline=pipeline;QualitySettings.vSyncCount=1;
            ImportTextures();
            var soil=Lit("Soil",Color.white,.04f,.85f);soil.SetTexture("_BaseMap",Texture("soil"));soil.SetTexture("_BumpMap",Texture("forest_floor_nor_gl_1k"));soil.EnableKeyword("_NORMALMAP");soil.SetFloat("_BumpScale",.65f);
            soil.SetTexture("_MetallicGlossMap",Texture("GroundMask"));soil.EnableKeyword("_METALLICSPECGLOSSMAP");soil.SetTexture("_OcclusionMap",Texture("GroundMask"));soil.EnableKeyword("_OCCLUSIONMAP");EditorUtility.SetDirty(soil);
            Lit("Wall",new Color(.78f,.75f,.66f),0,.15f);Lit("Roof",new Color(.34f,.16f,.1f),0,.15f);
            var bark=Lit("Bark",Color.white,0,.15f);AssignMaps(bark,"Bark","BarkNormal");var branch=Lit("Branch",Color.white,0,.15f);AssignMaps(branch,"Branch","BranchNormal");
            var leaf=Lit("Leaf",Color.white,0,.18f);AssignMaps(leaf,"Leaves","LeafNormal");leaf.SetFloat("_AlphaClip",1);leaf.SetFloat("_Cutoff",.4f);leaf.SetFloat("_Cull",0);leaf.EnableKeyword("_ALPHATEST_ON");leaf.renderQueue=(int)RenderQueue.AlphaTest;leaf.doubleSidedGI=true;EditorUtility.SetDirty(leaf);
            Lit("Carbon",new Color(.035f,.055f,.05f),.5f,.55f);Lit("Metal",new Color(.55f,.60f,.57f),.9f,.8f);
            var cork=Lit("Cork",Color.white,0,.12f);cork.SetTexture("_BaseMap",MakeCork());EditorUtility.SetDirty(cork);
            Unlit("Indicator",new Color(.87f,.94f,.5f));Unlit("Line",new Color(.60f,.66f,.57f));
            var water=Material("Water","Reviry/Vajgar Water");water.SetFloat("_WaveStrength",.35f);EditorUtility.SetDirty(water);
            var sky=Material("Sky","Skybox/Panoramic");sky.SetTexture("_MainTex",Texture("sky"));sky.SetFloat("_Exposure",1);EditorUtility.SetDirty(sky);
            var profile=AssetDatabase.LoadAssetAtPath<VolumeProfile>(Root+"OutdoorVolume.asset");
            if(profile==null){profile=ScriptableObject.CreateInstance<VolumeProfile>();AssetDatabase.CreateAsset(profile,Root+"OutdoorVolume.asset");var tone=profile.Add<Tonemapping>(true);tone.mode.Override(TonemappingMode.ACES);var bloom=profile.Add<Bloom>(true);bloom.intensity.Override(.08f);bloom.threshold.Override(1.2f);var color=profile.Add<ColorAdjustments>(true);color.postExposure.Override(-.1f);EditorUtility.SetDirty(profile);}
            PlayerSettings.companyName="Reviry CZ";PlayerSettings.productName="REVÍRY CZ — Vajgar";PlayerSettings.bundleVersion="0.4.0";PlayerSettings.colorSpace=ColorSpace.Linear;
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.iOS,"cz.reviry.vajgar");PlayerSettings.iOS.targetOSVersionString="16.0";
            PlayerSettings.defaultInterfaceOrientation=UIOrientation.LandscapeLeft;PlayerSettings.allowedAutorotateToLandscapeLeft=true;PlayerSettings.allowedAutorotateToLandscapeRight=true;PlayerSettings.allowedAutorotateToPortrait=false;PlayerSettings.allowedAutorotateToPortraitUpsideDown=false;
            var settings=AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset");if(settings.Length>0){var ps=new SerializedObject(settings[0]);var input=ps.FindProperty("activeInputHandler");if(input!=null){input.intValue=0;ps.ApplyModifiedPropertiesWithoutUndo();}}
            EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene(Scene,true)};EditorUtility.SetDirty(pipeline);AssetDatabase.SaveAssets();AssetDatabase.Refresh();Debug.Log("REVÍRY: URP project prepared. Scene: "+Scene);
        }
        static void ImportTextures()
        {
            foreach(var guid in AssetDatabase.FindAssets("t:Texture2D",new[]{"Assets/Reviry/Resources/Environment"}))
            {
                var path=AssetDatabase.GUIDToAssetPath(guid);var importer=AssetImporter.GetAtPath(path) as TextureImporter;if(importer==null)continue;
                bool normal=path.Contains("Normal")||path.Contains("nor_gl");bool data=normal||path.Contains("Mask")||path.Contains("arm");
                importer.textureType=normal?TextureImporterType.NormalMap:TextureImporterType.Default;importer.sRGBTexture=!data;importer.mipmapEnabled=true;importer.maxTextureSize=path.Contains("sky")?2048:1024;importer.alphaIsTransparency=path.Contains("Leaves");importer.wrapMode=path.Contains("sky")?TextureWrapMode.Clamp:TextureWrapMode.Repeat;importer.anisoLevel=4;importer.SaveAndReimport();
            }
        }
        static Texture2D Texture(string name)=>Resources.Load<Texture2D>("Environment/"+name);
        static Material Material(string name,string shader)
        {var path=Root+name+".mat";var m=AssetDatabase.LoadAssetAtPath<Material>(path);if(m==null){var s=Shader.Find(shader);if(s==null)throw new InvalidOperationException("Missing shader: "+shader);m=new Material(s){name=name,enableInstancing=true};AssetDatabase.CreateAsset(m,path);}return m;}
        static Material Lit(string name,Color color,float metallic,float smoothness)
        {var m=Material(name,"Universal Render Pipeline/Lit");m.SetColor("_BaseColor",color);m.SetFloat("_Metallic",metallic);m.SetFloat("_Smoothness",smoothness);EditorUtility.SetDirty(m);return m;}
        static void Unlit(string name,Color color){var m=Material(name,"Universal Render Pipeline/Unlit");m.SetColor("_BaseColor",color);EditorUtility.SetDirty(m);}
        static void AssignMaps(Material m,string color,string normal){m.SetTexture("_BaseMap",Texture(color));m.SetTexture("_BumpMap",Texture(normal));m.EnableKeyword("_NORMALMAP");EditorUtility.SetDirty(m);}
        static Texture2D MakeCork()
        {
            string path=Root+"CorkTexture.asset";var existing=AssetDatabase.LoadAssetAtPath<Texture2D>(path);if(existing!=null)return existing;
            var texture=new Texture2D(256,256,TextureFormat.RGB24,true);for(int y=0;y<256;y++)for(int x=0;x<256;x++){float noise=Mathf.PerlinNoise(x*.22f,y*.65f);float grain=Mathf.PerlinNoise(x*.8f,y*.8f);texture.SetPixel(x,y,new Color(.49f,.36f,.19f)*(.65f+noise*.7f)+new Color(.15f,.12f,.07f)*grain);}
            texture.Apply();AssetDatabase.CreateAsset(texture,path);return texture;
        }
        [MenuItem("Reviry/Open Vajgar Scene")]public static void OpenScene(){Prepare();EditorSceneManager.OpenScene(Scene);}
        [MenuItem("Reviry/Build macOS")]
        public static void BuildMac()=>Build(BuildTarget.StandaloneOSX,"Builds/macOS/Reviry.app");
        [MenuItem("Reviry/Export iOS Xcode Project")]
        public static void BuildIOS()=>Build(BuildTarget.iOS,"Builds/iOS");
        static void Build(BuildTarget target,string output)
        {
            Prepare();var group=BuildPipeline.GetBuildTargetGroup(target);
            if(!BuildPipeline.IsBuildTargetSupported(group,target))throw new InvalidOperationException("Install the Unity build support module for "+target+" before building.");
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{Scene},locationPathName=output,target=target,options=BuildOptions.Development});
            if(report.summary.result!=BuildResult.Succeeded)throw new InvalidOperationException("Build failed: "+report.summary.result);
            Debug.Log("Build succeeded: "+output+". iOS Xcode projects still require Apple signing and compilation.");
        }
    }
}
