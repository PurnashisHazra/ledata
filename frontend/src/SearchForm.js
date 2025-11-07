import React, { useState } from 'react';
import './SearchForm.css';

// Example options for dropdowns and choices
export const options = {
  // Fill with actual options as needed
    category: ["Manipulation", "Navigation", "Perception", "Multi-robot", "Simulation", "Other"],
    accessType: ["Open", "Restricted", "Commercial", "Academic"],
    datasetLicense: ["MIT", "Apache-2.0", "GPL", "CC-BY", "Proprietary", "Other"],
    gripperType: ["Parallel", "Vacuum", "Magnetic", "Custom", "None"],
    actionSpace: ["Continuous", "Discrete", "Hybrid"],
    robotType: ["Arm", "Mobile", "Humanoid", "Drone", "Custom"],
    robotMorphology: ["Fixed", "Modular", "Soft", "Rigid", "Other"],
    dataCollectionMethod: ["Teleoperation", "Autonomous", "Scripted", "Human Demonstration", "Synthetic"],
    humanInLoop: ["Yes", "No"],
    annotationMethod: ["Manual", "Automatic", "Crowdsourced", "None"],
    lidar: ["Yes", "No"],
    imu: ["Yes", "No"],
    audioSensors: ["Yes", "No"],
    forceTorque: ["Yes", "No"],
    proprioception: ["Yes", "No"],
    cameraCalibration: ["Yes", "No"],
    languageInstructions: ["Yes", "No"],
    languageAnnotation: ["Natural Language", "Structured", "None"],
    multimodalData: ["RGB", "Depth", "Audio", "Force", "IMU", "LiDAR", "Other"],
    domain: ["Household", "Industrial", "Outdoor", "Medical", "Education", "Other"],
    skills: ["Pick and Place", "Navigation", "Assembly", "Sorting", "Inspection", "Other"],
    tasks: ["Object Manipulation", "Path Planning", "Obstacle Avoidance", "Grasping", "Tracking", "Other"],
    taskTypes: ["Single", "Multi", "Hierarchical", "Sequential", "Parallel"],
    successFailureLabels: ["Success", "Failure", "Partial", "Not Applicable"],
    environmentType: ["Lab", "Home", "Factory", "Outdoor", "Simulated", "Other"],
    sceneType: ["Kitchen", "Office", "Warehouse", "Street", "Hospital", "Other"],
    sceneComplexity: ["Low", "Medium", "High"],
    lightingVariability: ["Stable", "Variable", "Low Light", "Bright", "Mixed"],
    publicationType: ["Conference", "Journal", "Workshop", "Preprint", "Other"],
};

export default function SearchForm() {
  const [form, setForm] = useState({});

    const handleChange = (e) => {
      const { name, value, type, multiple, checked } = e.target;
      if (type === 'checkbox') {
        setForm(f => ({ ...f, [name]: checked }));
      } else if (multiple) {
        // For multi-select dropdowns
        setForm(f => ({ ...f, [name]: Array.from(e.target.selectedOptions).map(o => o.value) }));
      } else {
        setForm(f => ({ ...f, [name]: value }));
      }
    };

    // Helper for radio/switch (all radios use this)
    const handleRadio = (e) => {
      const { name, value } = e.target;
      setForm(f => ({ ...f, [name]: value }));
    };
  return (
    <form className="search-form">
      <h2>Dataset Metadata</h2>
      <input name="datasetName" type="text" placeholder="Dataset Name" value={form.datasetName||''} onChange={handleChange} />
      <select name="category" value={form.category||''} onChange={handleChange}>
        <option value="">Category</option>
        {options.category.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="accessType" multiple value={form.accessType||[]} onChange={handleChange}>
        <option value="">Access Type</option>
        {options.accessType.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input name="yearReleased" type="number" placeholder="Year Released - Dataset" value={form.yearReleased||''} onChange={handleChange} />
      <input name="collectedBy" type="text" placeholder="Collected By (comma separated)" value={form.collectedBy||''} onChange={handleChange} />
      <textarea name="description" placeholder="Description" value={form.description||''} onChange={handleChange} />
      <select name="datasetLicense" value={form.datasetLicense||''} onChange={handleChange}>
        <option value="">Dataset License</option>
        {options.datasetLicense.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input name="fileSize" type="number" placeholder="File Size (GB)" value={form.fileSize||''} onChange={handleChange} />
      <input name="episodes" type="number" placeholder="#Episodes" value={form.episodes||''} onChange={handleChange} />
      <input name="trajectories" type="number" placeholder="#Trajectories" value={form.trajectories||''} onChange={handleChange} />
      <input name="timesteps" type="number" placeholder="#Timesteps" value={form.timesteps||''} onChange={handleChange} />
      <input name="hours" type="number" placeholder="#Hours" value={form.hours||''} onChange={handleChange} />
      <input name="demos" type="number" placeholder="#Demos" value={form.demos||''} onChange={handleChange} />
      <input name="robotsUsed" type="number" placeholder="#Robots Used" value={form.robotsUsed||''} onChange={handleChange} />
      <select name="gripperType" value={form.gripperType||''} onChange={handleChange}>
        <option value="">Gripper type</option>
        {options.gripperType.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="actionSpace" value={form.actionSpace||''} onChange={handleChange}>
        <option value="">Action space</option>
        {options.actionSpace.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input name="degreesOfFreedom" type="number" placeholder="Degrees of Freedom" value={form.degreesOfFreedom||''} onChange={handleChange} />
      <select name="robotType" value={form.robotType||''} onChange={handleChange}>
        <option value="">Robot Type</option>
        {options.robotType.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="robotMorphology" value={form.robotMorphology||''} onChange={handleChange}>
        <option value="">Robot Morphology</option>
        {options.robotMorphology.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="dataCollectionMethod" value={form.dataCollectionMethod||''} onChange={handleChange}>
        <option value="">Data Collection Method</option>
        {options.dataCollectionMethod.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input name="controlFrequency" type="number" placeholder="Control Frequency" value={form.controlFrequency||''} onChange={handleChange} />
      {/* Single choice fields as radio buttons */}
      <div className="radio-group">
        <label>Human-in-the-loop?</label>
        {options.humanInLoop.map(o => (
          <label key={o}><input type="radio" name="humanInLoop" value={o} checked={form.humanInLoop===o} onChange={handleRadio} /> {o}</label>
        ))}
      </div>
      <select name="annotationMethod" value={form.annotationMethod||''} onChange={handleChange}>
        <option value="">Annotation Method</option>
        {options.annotationMethod.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input name="rgbCameras" type="number" placeholder="#RGB Cameras" value={form.rgbCameras||''} onChange={handleChange} />
      <input name="depthCameras" type="number" placeholder="#Depth Cameras" value={form.depthCameras||''} onChange={handleChange} />
      <input name="wristCameras" type="number" placeholder="#Wrist Cameras" value={form.wristCameras||''} onChange={handleChange} />
      {/* Switches as radio buttons */}
      <div className="radio-group"><label>LiDAR</label>{options.lidar.map(o => (<label key={o}><input type="radio" name="lidar" value={o} checked={form.lidar===o} onChange={handleRadio} /> {o}</label>))}</div>
      <div className="radio-group"><label>IMU</label>{options.imu.map(o => (<label key={o}><input type="radio" name="imu" value={o} checked={form.imu===o} onChange={handleRadio} /> {o}</label>))}</div>
      <div className="radio-group"><label>Audio Sensors</label>{options.audioSensors.map(o => (<label key={o}><input type="radio" name="audioSensors" value={o} checked={form.audioSensors===o} onChange={handleRadio} /> {o}</label>))}</div>
      <div className="radio-group"><label>Force/Torque</label>{options.forceTorque.map(o => (<label key={o}><input type="radio" name="forceTorque" value={o} checked={form.forceTorque===o} onChange={handleRadio} /> {o}</label>))}</div>
      <div className="radio-group"><label>Proprioception</label>{options.proprioception.map(o => (<label key={o}><input type="radio" name="proprioception" value={o} checked={form.proprioception===o} onChange={handleRadio} /> {o}</label>))}</div>
      <div className="radio-group"><label>Camera Calibration</label>{options.cameraCalibration.map(o => (<label key={o}><input type="radio" name="cameraCalibration" value={o} checked={form.cameraCalibration===o} onChange={handleRadio} /> {o}</label>))}</div>
      <div className="radio-group"><label>Language Instructions</label>{options.languageInstructions.map(o => (<label key={o}><input type="radio" name="languageInstructions" value={o} checked={form.languageInstructions===o} onChange={handleRadio} /> {o}</label>))}</div>
      <select name="languageAnnotation" multiple value={form.languageAnnotation||[]} onChange={handleChange}>
        <option value="">Language annotation</option>
        {options.languageAnnotation.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="multimodalData" multiple value={form.multimodalData||[]} onChange={handleChange}>
        <option value="">Multimodal Data</option>
        {options.multimodalData.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="domain" multiple value={form.domain||[]} onChange={handleChange}>
        <option value="">Domain</option>
        {options.domain.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="skills" multiple value={form.skills||[]} onChange={handleChange}>
        <option value="">Skills</option>
        {options.skills.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="tasks" multiple value={form.tasks||[]} onChange={handleChange}>
        <option value="">Tasks</option>
        {options.tasks.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input name="taskCount" type="number" placeholder="Task count" value={form.taskCount||''} onChange={handleChange} />
      <select name="taskTypes" multiple value={form.taskTypes||[]} onChange={handleChange}>
        <option value="">Task Types</option>
        {options.taskTypes.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="successFailureLabels" value={form.successFailureLabels||''} onChange={handleChange}>
        <option value="">Success/Failure Labels</option>
        {options.successFailureLabels.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="environmentType" multiple value={form.environmentType||[]} onChange={handleChange}>
        <option value="">Environment Type</option>
        {options.environmentType.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input name="environments" type="number" placeholder="#Environments" value={form.environments||''} onChange={handleChange} />
      <input name="objectsVariety" type="number" placeholder="Objects Variety" value={form.objectsVariety||''} onChange={handleChange} />
      <select name="sceneType" multiple value={form.sceneType||[]} onChange={handleChange}>
        <option value="">Scene Type</option>
        {options.sceneType.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="sceneComplexity" value={form.sceneComplexity||''} onChange={handleChange}>
        <option value="">Scene Complexity</option>
        {options.sceneComplexity.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select name="lightingVariability" value={form.lightingVariability||''} onChange={handleChange}>
        <option value="">Lighting Variability</option>
        {options.lightingVariability.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input name="title" type="text" placeholder="Title" value={form.title||''} onChange={handleChange} />
      <input name="paperYear" type="number" placeholder="Paper Year" value={form.paperYear||''} onChange={handleChange} />
      <input name="authors" type="text" placeholder="Authors (comma separated)" value={form.authors||''} onChange={handleChange} />
      <input name="affiliations" type="text" placeholder="Affiliations (comma separated)" value={form.affiliations||''} onChange={handleChange} />
      <textarea name="abstract" placeholder="Abstract" value={form.abstract||''} onChange={handleChange} />
      <input name="modelsEvaluated" type="text" placeholder="Models evaluated (comma separated)" value={form.modelsEvaluated||''} onChange={handleChange} />
      <input name="venue" type="text" placeholder="Venue (comma separated)" value={form.venue||''} onChange={handleChange} />
      <select name="publicationType" value={form.publicationType||''} onChange={handleChange}>
        <option value="">Publication Type</option>
        {options.publicationType.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input name="doi" type="url" placeholder="DOI" value={form.doi||''} onChange={handleChange} />
      <input name="arxivLink" type="url" placeholder="ArXiv Link" value={form.arxivLink||''} onChange={handleChange} />
      <input name="pdfLink" type="url" placeholder="PDF Link" value={form.pdfLink||''} onChange={handleChange} />
      <input name="projectPage" type="url" placeholder="Project Page" value={form.projectPage||''} onChange={handleChange} />
      <input name="codeLink" type="url" placeholder="Code Link" value={form.codeLink||''} onChange={handleChange} />
      <input name="videoLink" type="url" placeholder="Video Link" value={form.videoLink||''} onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
