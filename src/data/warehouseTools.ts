export interface WarehouseTool {
  id: string;
  name: string;
  pricing_model: string;
  tco_tier: number;
  security_certs: string[];
  has_rest_api: boolean;
  deployment_model: "cloud" | "hybrid" | "self_hosted";
  cloud_providers: string[];
  scale_tier: "small" | "medium" | "large" | "very_large";
  workload_strengths: string[];
  native_ingestion_tier: "high" | "medium" | "low";
  streaming_support: boolean;
  ux_complexity: "simple" | "moderate" | "steep";
  customization_level: "ootb" | "configurable" | "composable";
  free_tier: boolean;
}

export const WAREHOUSE_TOOLS: WarehouseTool[] = [
  {id:"snowflake",name:"Snowflake",pricing_model:"consumption",tco_tier:4,security_certs:["SOC2","ISO27001","HIPAA","GDPR"],has_rest_api:true,deployment_model:"cloud",cloud_providers:["aws","gcp","azure"],scale_tier:"very_large",workload_strengths:["bi_reporting","data_science_ml","adhoc_exploration"],native_ingestion_tier:"medium",streaming_support:true,ux_complexity:"moderate",customization_level:"configurable",free_tier:false},
  {id:"bigquery",name:"Google BigQuery",pricing_model:"consumption",tco_tier:3,security_certs:["SOC2","ISO27001","HIPAA","GDPR"],has_rest_api:true,deployment_model:"cloud",cloud_providers:["gcp"],scale_tier:"very_large",workload_strengths:["bi_reporting","adhoc_exploration","data_science_ml"],native_ingestion_tier:"medium",streaming_support:true,ux_complexity:"simple",customization_level:"configurable",free_tier:true},
  {id:"redshift",name:"Amazon Redshift",pricing_model:"consumption",tco_tier:3,security_certs:["SOC2","ISO27001","HIPAA","GDPR"],has_rest_api:true,deployment_model:"cloud",cloud_providers:["aws"],scale_tier:"large",workload_strengths:["bi_reporting","adhoc_exploration"],native_ingestion_tier:"medium",streaming_support:true,ux_complexity:"moderate",customization_level:"configurable",free_tier:false},
  {id:"databricks",name:"Databricks",pricing_model:"consumption",tco_tier:4,security_certs:["SOC2","ISO27001","HIPAA","GDPR"],has_rest_api:true,deployment_model:"hybrid",cloud_providers:["aws","gcp","azure"],scale_tier:"very_large",workload_strengths:["data_science_ml","adhoc_exploration","bi_reporting"],native_ingestion_tier:"high",streaming_support:true,ux_complexity:"steep",customization_level:"composable",free_tier:true},
  {id:"fabric",name:"Microsoft Fabric",pricing_model:"tiered",tco_tier:3,security_certs:["SOC2","ISO27001","HIPAA","GDPR"],has_rest_api:true,deployment_model:"cloud",cloud_providers:["azure"],scale_tier:"large",workload_strengths:["bi_reporting","adhoc_exploration"],native_ingestion_tier:"high",streaming_support:true,ux_complexity:"moderate",customization_level:"configurable",free_tier:false},
  {id:"clickhouse",name:"ClickHouse Cloud",pricing_model:"consumption",tco_tier:2,security_certs:["SOC2"],has_rest_api:true,deployment_model:"cloud",cloud_providers:["aws","gcp","azure"],scale_tier:"very_large",workload_strengths:["real_time_streaming","adhoc_exploration"],native_ingestion_tier:"low",streaming_support:true,ux_complexity:"moderate",customization_level:"configurable",free_tier:true},
  {id:"firebolt",name:"Firebolt",pricing_model:"consumption",tco_tier:3,security_certs:["SOC2"],has_rest_api:true,deployment_model:"cloud",cloud_providers:["aws"],scale_tier:"large",workload_strengths:["real_time_streaming","bi_reporting"],native_ingestion_tier:"low",streaming_support:false,ux_complexity:"moderate",customization_level:"configurable",free_tier:false},
  {id:"singlestore",name:"SingleStore",pricing_model:"consumption",tco_tier:3,security_certs:["SOC2","ISO27001"],has_rest_api:true,deployment_model:"hybrid",cloud_providers:["aws","gcp","azure"],scale_tier:"large",workload_strengths:["real_time_streaming","bi_reporting"],native_ingestion_tier:"medium",streaming_support:true,ux_complexity:"moderate",customization_level:"configurable",free_tier:true},
  {id:"motherduck",name:"MotherDuck",pricing_model:"consumption",tco_tier:1,security_certs:["SOC2"],has_rest_api:true,deployment_model:"cloud",cloud_providers:["aws","gcp","azure"],scale_tier:"medium",workload_strengths:["adhoc_exploration","bi_reporting"],native_ingestion_tier:"low",streaming_support:false,ux_complexity:"simple",customization_level:"ootb",free_tier:true},
  {id:"dremio",name:"Dremio",pricing_model:"tiered",tco_tier:2,security_certs:["SOC2","ISO27001"],has_rest_api:true,deployment_model:"hybrid",cloud_providers:["aws","gcp","azure"],scale_tier:"large",workload_strengths:["adhoc_exploration","bi_reporting"],native_ingestion_tier:"medium",streaming_support:false,ux_complexity:"steep",customization_level:"composable",free_tier:true},
  {id:"teradata",name:"Teradata Vantage",pricing_model:"tiered",tco_tier:5,security_certs:["SOC2","ISO27001","HIPAA","GDPR"],has_rest_api:true,deployment_model:"hybrid",cloud_providers:["aws","gcp","azure"],scale_tier:"very_large",workload_strengths:["bi_reporting","data_science_ml"],native_ingestion_tier:"high",streaming_support:true,ux_complexity:"steep",customization_level:"composable",free_tier:false},
  {id:"oracle_adw",name:"Oracle Autonomous Data Warehouse",pricing_model:"consumption",tco_tier:4,security_certs:["SOC2","ISO27001","HIPAA","GDPR"],has_rest_api:true,deployment_model:"cloud",cloud_providers:["oci"],scale_tier:"large",workload_strengths:["bi_reporting","data_science_ml"],native_ingestion_tier:"high",streaming_support:false,ux_complexity:"steep",customization_level:"configurable",free_tier:true},
  {id:"db2warehouse",name:"IBM Db2 Warehouse",pricing_model:"tiered",tco_tier:4,security_certs:["SOC2","ISO27001","HIPAA","GDPR"],has_rest_api:true,deployment_model:"hybrid",cloud_providers:["ibm"],scale_tier:"large",workload_strengths:["bi_reporting"],native_ingestion_tier:"medium",streaming_support:false,ux_complexity:"steep",customization_level:"configurable",free_tier:false},
  {id:"yellowbrick",name:"Yellowbrick Data",pricing_model:"tiered",tco_tier:4,security_certs:["SOC2"],has_rest_api:true,deployment_model:"hybrid",cloud_providers:["aws","gcp","azure"],scale_tier:"large",workload_strengths:["bi_reporting","adhoc_exploration"],native_ingestion_tier:"low",streaming_support:false,ux_complexity:"steep",customization_level:"composable",free_tier:false},
  {id:"druid",name:"Apache Druid",pricing_model:"free",tco_tier:1,security_certs:[],has_rest_api:true,deployment_model:"self_hosted",cloud_providers:["aws","gcp","azure"],scale_tier:"large",workload_strengths:["real_time_streaming"],native_ingestion_tier:"high",streaming_support:true,ux_complexity:"steep",customization_level:"composable",free_tier:true},
];
