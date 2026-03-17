export interface UserCreate {
  id?: string
}

export interface UserRead {
  id: string
  created_at: string
}

export interface UserRunList {
  run_id: string
  status: string
  title: string
  brand: string
  model_name: string
  created_at: string
  completed_at: string | null
}