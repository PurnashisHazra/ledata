from typing import Optional, List, Union
from beanie import Document
from pydantic import BaseModel
from datetime import datetime


class Dataset(Document):
    # --- Dataset Metadata ---
    dataset_name: str
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.dataset_name or str(self.dataset_name).strip() == "":
            raise ValueError("dataset_name is a required field and cannot be empty.")
    dataset_name_additional_info: str = ""
    registered_name: str = ""
    registered_name_additional_info: str = ""
    part_of_oxe_or_which_dataset: str = ""
    part_of_oxe_or_which_dataset_additional_info: str = ""
    year_released_dataset: Union[int, str] = ""
    year_released_dataset_additional_info: str = ""
    collected_by: str = ""
    collected_by_additional_info: str = ""
    country: str = ""
    country_additional_info: str = ""
    description: str = ""
    description_additional_info: str = ""
    dataset_link_original: str = ""
    dataset_link_original_additional_info: str = ""
    hugging_face_link: str = ""
    hugging_face_link_additional_info: str = ""
    github_link: str = ""
    github_link_additional_info: str = ""
    access_type: str = ""
    access_type_additional_info: str = ""
    dataset_license: str = ""
    dataset_license_additional_info: str = ""
    restrictions: str = ""
    restrictions_additional_info: str = ""

    # --- Numeric Fields (User Confirmed) ---
    file_size_gb: Union[float, int, str] = ""
    file_size_gb_additional_info: str = ""
    episodes: Union[float, int, str] = ""
    episodes_additional_info: str = ""
    trajectories: Union[float, int, str] = ""
    trajectories_additional_info: str = ""
    timesteps: Union[float, int, str] = ""
    timesteps_additional_info: str = ""
    hours: Union[float, int, str] = ""
    hours_additional_info: str = ""
    demos: Union[float, int, str] = ""
    demos_additional_info: str = ""
    robots_used: Union[float, int, str] = ""
    robots_used_additional_info: str = ""
    degrees_of_freedom_dof: Union[float, int, str] = ""
    degrees_of_freedom_dof_additional_info: str = ""
    environments: Union[float, int, str] = ""
    environments_additional_info: str = ""
    objects_variety: Union[float, int, str] = ""
    objects_variety_additional_info: str = ""
    rgb_cameras: Union[float, int, str] = ""
    rgb_cameras_additional_info: str = ""
    depth_cameras: Union[float, int, str] = ""
    depth_cameras_additional_info: str = ""
    wrist_cameras: Union[float, int, str] = ""
    wrist_cameras_additional_info: str = ""
    cameras_360: Union[float, int, str] = ""
    cameras_360_additional_info: str = ""
    control_frequency: Union[float, int, str] = ""
    control_frequency_additional_info: str = ""
    paper_year: Union[float, int, str] = ""
    paper_year_additional_info: str = ""
    citation_count_google_scholar: Union[float, int, str] = ""
    citation_count_google_scholar_additional_info: str = ""
    duration_of_videos_hours: Union[float, int, str] = ""

    # --- Robot & Environment Metadata ---
    robot_type: str = ""
    robot_type_additional_info: str = ""
    robot_models: str = ""
    robot_models_additional_info: str = ""
    robot_morphology: str = ""
    robot_morphology_additional_info: str = ""
    gripper_type: str = ""
    gripper_type_additional_info: str = ""
    action_space: str = ""
    action_space_additional_info: str = ""
    domain: str = ""
    domain_additional_info: str = ""
    skills: str = ""
    skills_additional_info: str = ""
    tasks: str = ""
    tasks_additional_info: str = ""
    task_count: Union[int, str] = ""
    task_count_additional_info: str = ""
    task_types: str = ""
    task_types_additional_info: str = ""
    success_failure_labels: str = ""
    success_failure_labels_additional_info: str = ""
    environment_type: str = ""
    environment_type_additional_info: str = ""
    scene_type: str = ""
    scene_type_additional_info: str = ""
    scene_complexity: str = ""
    scene_complexity_additional_info: str = ""
    lighting_variability: str = ""
    lighting_variability_additional_info: str = ""

    # --- Sensors ---
    lidar: str = ""
    lidar_additional_info: str = ""
    imu: str = ""
    imu_additional_info: str = ""
    audio_sensors: str = ""
    audio_sensors_additional_info: str = ""
    force_torque: str = ""
    force_torque_additional_info: str = ""
    proprioception: str = ""
    proprioception_additional_info: str = ""
    camera_calibration: str = ""
    camera_calibration_additional_info: str = ""

    # --- Language & Data Collection ---
    language_instructions: str = ""
    language_instructions_additional_info: str = ""
    language_annotation: str = ""
    language_annotation_additional_info: str = ""
    multimodal_data: str = ""
    multimodal_data_additional_info: str = ""
    data_collection_method: str = ""
    data_collection_method_additional_info: str = ""
    human_in_the_loop: str = ""
    human_in_the_loop_additional_info: str = ""
    suboptimal_data_included: str = ""
    suboptimal_data_included_additional_info: str = ""
    annotation_method: str = ""
    annotation_method_additional_info: str = ""

    # --- Paper Metadata ---
    paper_title: str = ""
    paper_title_additional_info: str = ""
    authors: str = ""
    authors_additional_info: str = ""
    affiliations: str = ""
    affiliations_additional_info: str = ""
    abstract: str = ""
    abstract_additional_info: str = ""
    venue: str = ""
    venue_additional_info: str = ""
    publication_type: str = ""
    publication_type_additional_info: str = ""
    doi: str = ""
    doi_additional_info: str = ""
    arxiv_link: str = ""
    arxiv_link_additional_info: str = ""
    arxiv_submitter_email: str = ""
    arxiv_submitter_email_additional_info: str = ""
    arxiv_submitter_name: str = ""
    arxiv_submitter_name_additional_info: str = ""
    citation: str = ""
    citation_additional_info: str = ""
    pdf_link: str = ""
    pdf_link_additional_info: str = ""
    project_page: str = ""
    project_page_additional_info: str = ""
    code_link: str = ""
    code_link_additional_info: str = ""
    video_link: str = ""
    video_link_additional_info: str = ""
    bibtex: str = ""
    bibtex_additional_info: str = ""
    latex_ref: str = ""
    latex_ref_additional_info: str = ""
    keywords: str = ""
    keywords_additional_info: str = ""
    license_to_use_the_paper_for_ai_training: str = ""
    license_to_use_the_paper_for_ai_training_additional_info: str = ""
    topics: str = ""
    topics_additional_info: str = ""
    subjects_from_arxiv: str = ""
    subjects_from_arxiv_additional_info: str = ""

    # --- Citations & Benchmarks ---
    used_by: str = ""
    used_by_additional_info: str = ""
    paper_license: str = ""
    paper_license_additional_info: str = ""
    benchmarks: str = ""
    benchmarks_additional_info: str = ""
    models_evaluated: str = ""
    models_evaluated_additional_info: str = ""
    industry_usage: str = ""
    industry_usage_additional_info: str = ""
    notable_papers: str = ""
    notable_papers_additional_info: str = ""

    # --- Other Metadata ---
    original_format: str = ""
    original_format_additional_info: str = ""
    rlds: str = ""
    rlds_additional_info: str = ""
    lerobot_v3_0: str = ""
    lerobot_v3_0_additional_info: str = ""
    frame_count: Union[int, str] = ""
    demographics: str = ""
    demographics_additional_info: str = ""
    physical_attributes: str = ""
    physical_attributes_additional_info: str = ""
    social_context: str = ""
    social_context_additional_info: str = ""

    class Settings:
        name = "datasets"


class Project(BaseModel):
    """A simple project container for a user's project.

    Stores lightweight metadata and an array of dataset ids that belong to the project.
    Using ids (strings) keeps the model simple and avoids circular Link/import complexity.
    """
    id: str = ""
    name: str
    description: str = ""
    dataset_ids: List[str] = []


class User(Document):
    """User document for authentication and per-user projects.

    Fields:
    - username, email: identity fields
    - password_hash: store a hashed password (do not store plaintext passwords)
    - projects: list of Project objects, each containing dataset ids added by the user
    - created_at / updated_at timestamps
    """
    username: str
    email: str
    password_hash: str
    # Profile fields
    role_title: str = ""
    organization: str = ""
    github_url: str = ""
    linkedin_url: str = ""
    bio: str = ""
    image_url: str = ""
    public_profile: bool = False
    public_profile_slug: str = ""
    auth_token: Optional[str] = None
    token_expires: Optional[datetime] = None
    # email verification
    email_verified: bool = False
    email_verification_token: Optional[str] = None
    email_verification_expires: Optional[datetime] = None
    projects: List[Project] = []
    # list of dataset ids the user has saved
    saved_datasets: List[str] = []
    # list of dataset ids the user has submitted/created
    submitted: List[str] = []
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"