import React from 'react';
import './AddDataset.css';
import Header from './Header';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from './auth';

const initialState = {
  dataset_name: '', access_type: '', category: '', year_released_dataset: '', collected_by: '', description: '', dataset_license: '',
  file_size_gb: '', episodes: '', trajectories: '', timesteps: '', hours: '', demos: '', robots_used: '', gripper_type: '', action_space: '', dof: '',
  robot_type: '', robot_models: '', robot_morphology: '', data_collection_method: '', control_frequency: '', human_in_the_loop: '', suboptimal_data_included: '', annotation_method: '',
  rgb_cameras: '', depth_cameras: '', wrist_cameras: '', lidar: '', imu: '', audio_sensors: '', force_torque: '', proprioception: '', camera_calibration: '', language_in_the_loop: '', language_annotation: '', multimodal_data: '',
  domain: '', skills: '', tasks: '', task_count: '', task_types: '', success_failure_labels: '', environment_type: '', environments: '', objects_variety: '', scene_type: '', scene_complexity: '', lighting_variability: '',
  paper_title: '', paper_year: '', authors: '', affiliations: '', abstract: '', models_evaluated: '', venue: '', publication_type: '', doi: '', arxiv_link: '', pdf_link: '', project_page: '', code_link: '', video_link: ''
};

export default function ViewDataset(){
  const [form, setForm] = React.useState(initialState);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if(!id) return;
      try{
        const token = localStorage.getItem('ledata_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_URL}/api/datasets/${id}`, { headers });
        if(res.ok){
          const data = await res.json();
          const mapped = { ...initialState };
          Object.entries(data).forEach(([k,v]) => {
            if(k === 'degrees_of_freedom_dof') mapped['dof'] = v;
            else if(k in mapped) mapped[k] = v;
          });
          if(mounted) setForm(mapped);
        } else {
          if(res.status === 404) navigate('/search');
        }
      }catch(e){ console.error('Failed to fetch dataset', e); }
      if(mounted) setLoading(false);
    })();
    return () => { mounted = false };
  }, [id]);

  if(loading) return (<div style={{padding:24}}>Loading...</div>);

  const RoInput = ({name, className}) => (
    <div className={"add-dataset-input" + (className ? (' ' + className) : '')} style={{whiteSpace:'pre-wrap'}}>{form[name] || ''}</div>
  );

  const RoTextarea = ({name, style}) => (
    <div className={"add-dataset-input"} style={{minHeight: style && style.minHeight ? style.minHeight : 120, whiteSpace:'pre-wrap'}}>{form[name] || ''}</div>
  );

  return (
    <div>
      <Header />
      <div className="add-dataset-modal">
      <div className="add-dataset-box add-dataset-border">
        <div className="add-dataset-nav">
          <div className="add-dataset-navbar">
            <RouterLink to="/"><span className="add-dataset-logo">{'{Le}Data'}</span></RouterLink>
            {user && (
              <div style={{position:'relative'}}>
                <button className="hi-user-btn">Hi {user.username}</button>
              </div>
            )}
            <span className="add-dataset-icons">
              <span role="img" aria-label="github">🌐</span>
              <span role="img" aria-label="x">❌</span>
              <span role="img" aria-label="linkedin">in</span>
            </span>
            <span className="add-dataset-navlinks">Dashboard Data services Profile</span>
            <button className="add-dataset-addbtn">Add</button>
            <span className="add-dataset-profileicon">↪️</span>
          </div>
          <div className="add-dataset-tabs">Discover | Saved | Submitted | My Projects</div>
        </div>
        <div className="add-dataset-header">
          Dataset <span className="add-dataset-header-desc">(read-only)</span>
          <span className="add-dataset-close">X</span>
        </div>
        <div className="add-dataset-section add-dataset-border">
          <div className="add-dataset-label">Dataset name</div>
          <RoInput name="dataset_name" />
          <div className="add-dataset-row">
            <div style={{flex:1}}><RoInput name="access_type" className="" /></div>
            <div style={{flex:1}}><RoInput name="category" className="" /></div>
            <div style={{flex:1}}><RoInput name="year_released_dataset" className="" /></div>
          </div>
          <div className="add-dataset-icons-row">
            <span className="add-dataset-icon">⚙️</span>
            <span className="add-dataset-icon">🌐</span>
            <span className="add-dataset-icon">🤖</span>
            <span className="add-dataset-icon">🧑‍🔬</span>
          </div>
          <div className="add-dataset-row">
            <div style={{flex:1}}><RoInput name="collected_by" /></div>
          </div>
          <RoTextarea name="description" style={{minHeight:120}} />
          <RoInput name="dataset_license" />
        </div>
        <div className="add-dataset-grid-2x2">
          <div className="add-dataset-boxcell add-dataset-border">
            <div className="add-dataset-title">Quick metrics</div>
            <div className="quick-metrics-grid">
              <div className="quick-metrics-label">File Size (GB):</div>
              <RoInput name="file_size_gb" className="add-dataset-input quick-metrics-input" />
              <div className="quick-metrics-label">#Episodes:</div>
              <RoInput name="episodes" className="add-dataset-input quick-metrics-input" />
              <div className="quick-metrics-label">#Trajectories:</div>
              <RoInput name="trajectories" className="add-dataset-input quick-metrics-input" />
              <div className="quick-metrics-label">#Timesteps:</div>
              <RoInput name="timesteps" className="add-dataset-input quick-metrics-input" />
              <div className="quick-metrics-label">#Hours:</div>
              <RoInput name="hours" className="add-dataset-input quick-metrics-input" />
              <div className="quick-metrics-label">#Demos:</div>
              <RoInput name="demos" className="add-dataset-input quick-metrics-input" />
              <div className="quick-metrics-label">#Robots Used:</div>
              <RoInput name="robots_used" className="add-dataset-input quick-metrics-input" />
              <div className="quick-metrics-label">Gripper type:</div>
              <RoInput name="gripper_type" className="add-dataset-input quick-metrics-input" />
              <div className="quick-metrics-label">Action space:</div>
              <RoInput name="action_space" className="add-dataset-input quick-metrics-input" />
              <div className="quick-metrics-label">DoF:</div>
              <RoInput name="dof" className="add-dataset-input quick-metrics-input" />
            </div>
          </div>
          <div className="add-dataset-boxcell add-dataset-border">
            <div className="add-dataset-title">Robot</div>
            <div className="add-dataset-row-label">
              <div>Robot Type:</div>
              <RoInput name="robot_type" />
            </div>
            <div className="add-dataset-row-label">
              <div>Robot Models:</div>
              <RoInput name="robot_models" />
            </div>
            <div className="add-dataset-row-label">
              <div>Robot Morphology:</div>
              <RoInput name="robot_morphology" />
            </div>
            <div className="add-dataset-title" style={{marginTop:'24px'}}>Data Collection</div>
            <div className="add-dataset-row-label">
              <div>Data Collection Method:</div>
              <RoInput name="data_collection_method" />
            </div>
            <div className="add-dataset-row-label">
              <div>Control Frequency:</div>
              <RoInput name="control_frequency" />
            </div>
            <div className="add-dataset-row-label">
              <div>Human-in-the-loop?</div>
              <RoInput name="human_in_the_loop" />
            </div>
            <div className="add-dataset-row-label">
              <div>Suboptimal Data Included?</div>
              <RoInput name="suboptimal_data_included" />
            </div>
            <div className="add-dataset-row-label">
              <div>Annotation Method:</div>
              <RoInput name="annotation_method" />
            </div>
          </div>
        </div>
        <div className="add-dataset-grid-2x2" style={{marginTop:16}}>
          <div className="add-dataset-boxcell add-dataset-border">
            <div className="add-dataset-title">Equipment</div>
            <div className="add-dataset-row-label">
              <div>#RGB Cameras:</div>
              <RoInput name="rgb_cameras" />
            </div>
            <div className="add-dataset-row-label">
              <div>#Depth Cameras:</div>
              <RoInput name="depth_cameras" />
            </div>
            <div className="add-dataset-row-label">
              <div>#Wrist Cameras:</div>
              <RoInput name="wrist_cameras" />
            </div>
            <div className="add-dataset-row-label">
              <div>LiDAR:</div>
              <RoInput name="lidar" />
            </div>
            <div className="add-dataset-row-label">
              <div>IMU:</div>
              <RoInput name="imu" />
            </div>
            <div className="add-dataset-row-label">
              <div>Audio Sensors:</div>
              <RoInput name="audio_sensors" />
            </div>
            <div className="add-dataset-row-label">
              <div>Force/Torque:</div>
              <RoInput name="force_torque" />
            </div>
            <div className="add-dataset-row-label">
              <div>Proprioception:</div>
              <RoInput name="proprioception" />
            </div>
            <div className="add-dataset-row-label">
              <div>Camera Calibration:</div>
              <RoInput name="camera_calibration" />
            </div>
            <div className="add-dataset-row-label">
              <div>Language Instructions:</div>
              <RoInput name="language_in_the_loop" />
            </div>
            <div className="add-dataset-row-label">
              <div>Language annotation:</div>
              <RoInput name="language_annotation" />
            </div>
            <div className="add-dataset-row-label">
              <div>Multimodal Data:</div>
              <RoInput name="multimodal_data" />
            </div>
          </div>
          <div className="add-dataset-boxcell add-dataset-border">
            <div className="add-dataset-title">Tasks and Environment</div>
            <div className="add-dataset-row-label">
              <div>Domain:</div>
              <RoInput name="domain" />
            </div>
            <div className="add-dataset-row-label">
              <div>Skills:</div>
              <RoInput name="skills" />
            </div>
            <div className="add-dataset-row-label">
              <div>Tasks:</div>
              <RoInput name="tasks" />
            </div>
            <div className="add-dataset-row-label">
              <div>Task count:</div>
              <RoInput name="task_count" />
            </div>
            <div className="add-dataset-row-label">
              <div>Task Types:</div>
              <RoInput name="task_types" />
            </div>
            <div className="add-dataset-row-label">
              <div>Success/Failure Labels:</div>
              <RoInput name="success_failure_labels" />
            </div>
            <div className="add-dataset-row-label">
              <div>Environment Type:</div>
              <RoInput name="environment_type" />
            </div>
            <div className="add-dataset-row-label">
              <div>#Environments:</div>
              <RoInput name="environments" />
            </div>
            <div className="add-dataset-row-label">
              <div>Objects Variety:</div>
              <RoInput name="objects_variety" />
            </div>
            <div className="add-dataset-row-label">
              <div>Scene Type:</div>
              <RoInput name="scene_type" />
            </div>
            <div className="add-dataset-row-label">
              <div>Scene Complexity:</div>
              <RoInput name="scene_complexity" />
            </div>
            <div className="add-dataset-row-label">
              <div>Lighting Variability:</div>
              <RoInput name="lighting_variability" />
            </div>
          </div>
        </div>
        <div className="add-dataset-section add-dataset-border" style={{marginTop:16}}>
          <div className="add-dataset-title">Publication</div>
          <div>Title <RoInput name="paper_title" /></div>
          <div>Paper Year: <RoInput name="paper_year" /></div>
          <div>Authors: <RoInput name="authors" /></div>
          <div>Affiliations: <RoInput name="affiliations" /></div>
          <div>Abstract <RoTextarea name="abstract" style={{minHeight:220}} /></div>
          <div>Models evaluated: <RoInput name="models_evaluated" /></div>
          <div>Venue: <RoInput name="venue" /></div>
          <div>Publication Type: <RoInput name="publication_type" /></div>
          <div>DOI: <RoInput name="doi" /></div>
          <div>ArXiv Link: <RoInput name="arxiv_link" /></div>
          <div>PDF Link: <RoInput name="pdf_link" /></div>
          <div>Project Page: <RoInput name="project_page" /></div>
          <div>Code Link: <RoInput name="code_link" /></div>
          <div>Video Link: <RoInput name="video_link" /></div>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:12, marginTop:18}}>
          <RouterLink to={`/edit-dataset/${id}`} className="small-btn">Edit</RouterLink>
          <button className="small-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    </div>
    </div>
  );
}
