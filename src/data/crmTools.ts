export interface CrmTool {
  id: string;
  name: string;
  pricing_model: string;
  tco_tier: number;
  security_certs: string[];
  has_rest_api: boolean;
  connector_tier: "high" | "medium" | "low";
  ux_complexity: "simple" | "moderate" | "steep";
  customization_level: "ootb" | "configurable" | "composable";
  free_tier: boolean;
  email_calling_builtin: boolean;
  marketing_automation_tier: "none" | "basic" | "advanced";
  mobile_app_quality: "basic" | "full";
  reporting_depth: "basic" | "advanced";
}

export const CRM_TOOLS: CrmTool[] = [
  {id:"salesforce",name:"Salesforce Sales Cloud",pricing_model:"per-seat",tco_tier:5,security_certs:["SOC2","ISO27001","GDPR"],has_rest_api:true,connector_tier:"high",ux_complexity:"steep",customization_level:"composable",free_tier:false,email_calling_builtin:true,marketing_automation_tier:"advanced",mobile_app_quality:"full",reporting_depth:"advanced"},
  {id:"dynamics365",name:"Microsoft Dynamics 365 Sales",pricing_model:"per-seat",tco_tier:4,security_certs:["SOC2","ISO27001","GDPR"],has_rest_api:true,connector_tier:"high",ux_complexity:"steep",customization_level:"composable",free_tier:false,email_calling_builtin:true,marketing_automation_tier:"advanced",mobile_app_quality:"full",reporting_depth:"advanced"},
  {id:"hubspot",name:"HubSpot CRM",pricing_model:"tiered",tco_tier:2,security_certs:["SOC2","GDPR"],has_rest_api:true,connector_tier:"high",ux_complexity:"moderate",customization_level:"configurable",free_tier:true,email_calling_builtin:true,marketing_automation_tier:"advanced",mobile_app_quality:"full",reporting_depth:"advanced"},
  {id:"zoho",name:"Zoho CRM",pricing_model:"per-seat",tco_tier:1,security_certs:["SOC2","GDPR"],has_rest_api:true,connector_tier:"medium",ux_complexity:"moderate",customization_level:"configurable",free_tier:true,email_calling_builtin:true,marketing_automation_tier:"basic",mobile_app_quality:"full",reporting_depth:"basic"},
  {id:"pipedrive",name:"Pipedrive",pricing_model:"per-seat",tco_tier:2,security_certs:["SOC2","GDPR"],has_rest_api:true,connector_tier:"medium",ux_complexity:"simple",customization_level:"configurable",free_tier:false,email_calling_builtin:true,marketing_automation_tier:"basic",mobile_app_quality:"full",reporting_depth:"basic"},
  {id:"freshsales",name:"Freshsales",pricing_model:"per-seat",tco_tier:2,security_certs:["SOC2","GDPR"],has_rest_api:true,connector_tier:"medium",ux_complexity:"simple",customization_level:"configurable",free_tier:true,email_calling_builtin:true,marketing_automation_tier:"basic",mobile_app_quality:"full",reporting_depth:"basic"},
  {id:"copper",name:"Copper",pricing_model:"per-seat",tco_tier:2,security_certs:["SOC2"],has_rest_api:true,connector_tier:"medium",ux_complexity:"simple",customization_level:"configurable",free_tier:false,email_calling_builtin:true,marketing_automation_tier:"none",mobile_app_quality:"full",reporting_depth:"basic"},
  {id:"close",name:"Close",pricing_model:"per-seat",tco_tier:3,security_certs:["SOC2"],has_rest_api:true,connector_tier:"medium",ux_complexity:"simple",customization_level:"configurable",free_tier:false,email_calling_builtin:true,marketing_automation_tier:"none",mobile_app_quality:"basic",reporting_depth:"basic"},
  {id:"nutshell",name:"Nutshell",pricing_model:"per-seat",tco_tier:1,security_certs:[],has_rest_api:true,connector_tier:"low",ux_complexity:"simple",customization_level:"ootb",free_tier:false,email_calling_builtin:true,marketing_automation_tier:"basic",mobile_app_quality:"basic",reporting_depth:"basic"},
  {id:"attio",name:"Attio",pricing_model:"per-seat",tco_tier:2,security_certs:["SOC2"],has_rest_api:true,connector_tier:"medium",ux_complexity:"moderate",customization_level:"composable",free_tier:true,email_calling_builtin:true,marketing_automation_tier:"none",mobile_app_quality:"basic",reporting_depth:"basic"},
  {id:"folk",name:"Folk",pricing_model:"per-seat",tco_tier:1,security_certs:[],has_rest_api:true,connector_tier:"low",ux_complexity:"simple",customization_level:"ootb",free_tier:true,email_calling_builtin:true,marketing_automation_tier:"none",mobile_app_quality:"basic",reporting_depth:"basic"},
  {id:"mondaycrm",name:"monday Sales CRM",pricing_model:"per-seat",tco_tier:2,security_certs:["SOC2","ISO27001","GDPR"],has_rest_api:true,connector_tier:"medium",ux_complexity:"moderate",customization_level:"composable",free_tier:true,email_calling_builtin:true,marketing_automation_tier:"basic",mobile_app_quality:"full",reporting_depth:"basic"},
  {id:"insightly",name:"Insightly",pricing_model:"per-seat",tco_tier:2,security_certs:["SOC2","GDPR"],has_rest_api:true,connector_tier:"medium",ux_complexity:"moderate",customization_level:"configurable",free_tier:true,email_calling_builtin:true,marketing_automation_tier:"basic",mobile_app_quality:"full",reporting_depth:"basic"},
  {id:"sugarcrm",name:"SugarCRM",pricing_model:"per-seat",tco_tier:4,security_certs:["SOC2","ISO27001","GDPR"],has_rest_api:true,connector_tier:"medium",ux_complexity:"steep",customization_level:"composable",free_tier:false,email_calling_builtin:true,marketing_automation_tier:"advanced",mobile_app_quality:"full",reporting_depth:"advanced"},
  {id:"suitecrm",name:"SuiteCRM",pricing_model:"free",tco_tier:1,security_certs:[],has_rest_api:true,connector_tier:"low",ux_complexity:"steep",customization_level:"composable",free_tier:true,email_calling_builtin:true,marketing_automation_tier:"basic",mobile_app_quality:"basic",reporting_depth:"basic"},
];
