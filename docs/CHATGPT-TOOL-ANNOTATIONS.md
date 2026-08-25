# Auditoría de etiquetas de tools para ChatGPT

Generada desde el catálogo MCP local completo. Las etiquetas visibles para ChatGPT son independientes de la regla existente de planes: cambiar una etiqueta no concede ni quita acceso.

- `readOnlyHint`: la tool se limita a consultar o calcular.
- `destructiveHint`: puede borrar, sobrescribir, revocar o ejecutar una acción irreversible.
- `openWorldHint`: puede cambiar un sistema público o un tercero externo.

- Tools auditadas: 328
- Solo lectura: 275
- Con efectos o cambios de estado: 53
- Destructivas o irreversibles: 30
- Cambian sistemas públicos o externos: 19
- Bloqueadas por la regla existente del plan de solo lectura: 32

| Tool | readOnlyHint | destructiveHint | openWorldHint | Impacto real | Regla existente del plan de solo lectura |
|---|:---:|:---:|:---:|---|:---:|
| `akamai_cache_purge` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `akamai_diag` | true | false | false | Solo consulta | Permitida |
| `akamai_papi_redirects` | true | false | false | Solo consulta | Permitida |
| `akamai_papi_rules` | true | false | false | Solo consulta | Permitida |
| `akamai_properties_list` | true | false | false | Solo consulta | Permitida |
| `akamai_properties_search` | true | false | false | Solo consulta | Permitida |
| `akamai_waf_policies` | true | false | false | Solo consulta | Permitida |
| `akamai_waf_rules` | true | false | false | Solo consulta | Permitida |
| `alerts_active` | true | false | false | Solo consulta | Permitida |
| `alg_incidents` | true | false | false | Solo consulta | Permitida |
| `alg_index_settings` | true | false | false | Solo consulta | Permitida |
| `alg_indices_list` | true | false | false | Solo consulta | Permitida |
| `alg_logs` | true | false | false | Solo consulta | Permitida |
| `alg_object_get` | true | false | false | Solo consulta | Permitida |
| `alg_search` | true | false | false | Solo consulta | Permitida |
| `alg_status` | true | false | false | Solo consulta | Permitida |
| `argocd_app_resources` | true | false | false | Solo consulta | Permitida |
| `argocd_app_unhealthy` | true | false | false | Solo consulta | Permitida |
| `argocd_debug` | true | false | false | Solo consulta | Permitida |
| `argocd_get_app` | true | false | false | Solo consulta | Permitida |
| `argocd_list_apps` | true | false | false | Solo consulta | Permitida |
| `argocd_list_clusters` | true | false | false | Solo consulta | Permitida |
| `aws_athena_query` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `aws_bedrock_agent_diagnose` | true | false | false | Solo consulta | Permitida |
| `aws_cli_query` | true | false | false | Solo consulta | Permitida |
| `aws_cloudwatch_logs_search` | true | false | false | Solo consulta | Permitida |
| `aws_codeartifact_packages` | true | false | false | Solo consulta | Permitida |
| `aws_codeartifact_versions` | true | false | false | Solo consulta | Permitida |
| `aws_dynamodb_describe_table` | true | false | false | Solo consulta | Permitida |
| `aws_dynamodb_query` | true | false | false | Solo consulta | Permitida |
| `aws_ecr_images` | true | false | false | Solo consulta | Permitida |
| `aws_ecr_repos` | true | false | false | Solo consulta | Permitida |
| `aws_lambda_agent_diagnose` | true | false | false | Solo consulta | Permitida |
| `aws_rds_data_query` | true | false | false | Solo consulta | Permitida |
| `aws_s3_find` | true | false | false | Solo consulta | Permitida |
| `aws_secretsmanager_describe` | true | false | false | Solo consulta | Permitida |
| `aws_secretsmanager_list` | true | false | false | Solo consulta | Permitida |
| `aws_session_revoke` | false | true | false | Sobrescribe, elimina o revoca estado privado | Bloqueada |
| `aws_session_status` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `aws_sso_login` | false | false | false | Cambia estado privado de forma acotada | Bloqueada |
| `aws_sso_login_device_poll` | false | false | false | Cambia estado privado de forma acotada | Bloqueada |
| `aws_sso_login_device_start` | false | false | false | Cambia estado privado de forma acotada | Bloqueada |
| `aws_sso_login_global_poll` | false | false | false | Cambia estado privado de forma acotada | Bloqueada |
| `aws_sso_login_global_start` | false | false | false | Cambia estado privado de forma acotada | Bloqueada |
| `aws_sso_login_remote` | false | false | false | Cambia estado privado de forma acotada | Bloqueada |
| `aws_sso_logout` | false | true | false | Sobrescribe, elimina o revoca estado privado | Bloqueada |
| `aws_sts_whoami` | true | false | false | Solo consulta | Permitida |
| `azure_blob_find` | true | false | false | Solo consulta | Permitida |
| `azure_cli_query` | true | false | false | Solo consulta | Permitida |
| `azure_dns_lookup` | true | false | false | Solo consulta | Permitida |
| `azure_keyvault_secret_metadata` | true | false | false | Solo consulta | Permitida |
| `azure_keyvault_secrets_list` | true | false | false | Solo consulta | Permitida |
| `azure_log_analytics_query` | true | false | false | Solo consulta | Permitida |
| `azure_resource_groups` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_dlq_content` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_health_overview` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_message_explorer` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_monitoring_report` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_namespace_health` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_namespaces` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_queue_deadletter` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_queue_metrics` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_queues` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_resourcegroup_detect` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_topic_sub_metrics` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_topic_subscriptions` | true | false | false | Solo consulta | Permitida |
| `azure_servicebus_topics` | true | false | false | Solo consulta | Permitida |
| `azure_subscription_set` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `azure_subscriptions_list` | true | false | false | Solo consulta | Permitida |
| `azure_user_login_poll` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `azure_user_login_start` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `azure_user_session_revoke` | false | true | false | Sobrescribe, elimina o revoca estado privado | Bloqueada |
| `azure_user_session_status` | true | false | false | Solo consulta | Permitida |
| `bb_branches_list` | true | false | false | Solo consulta | Permitida |
| `bb_commits_list` | true | false | false | Solo consulta | Permitida |
| `bb_pipeline_diagnose` | true | false | false | Solo consulta | Permitida |
| `bb_pipeline_get` | true | false | false | Solo consulta | Permitida |
| `bb_pipelines_latest` | true | false | false | Solo consulta | Permitida |
| `bb_pr_commits` | true | false | false | Solo consulta | Permitida |
| `bb_pr_diff` | true | false | false | Solo consulta | Permitida |
| `bb_pr_diffstat` | true | false | false | Solo consulta | Permitida |
| `bb_pr_get` | true | false | false | Solo consulta | Permitida |
| `bb_pr_search` | true | false | false | Solo consulta | Permitida |
| `bb_repos_list` | true | false | false | Solo consulta | Permitida |
| `bb_tags_list` | true | false | false | Solo consulta | Permitida |
| `cert_status` | true | false | false | Solo consulta | Permitida |
| `cf_account_ruleset_entrypoint_get` | true | false | false | Solo consulta | Permitida |
| `cf_analytics_overview` | true | false | false | Solo consulta | Permitida |
| `cf_cache_purge` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_cache_rules_list` | true | false | false | Solo consulta | Permitida |
| `cf_cache_rules_replace` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_cname_flattening_get` | true | false | false | Solo consulta | Permitida |
| `cf_cname_flattening_set` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_config_rules_list` | true | false | false | Solo consulta | Permitida |
| `cf_config_rules_replace` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_dns_records` | true | false | false | Solo consulta | Permitida |
| `cf_firewall_events` | true | false | false | Solo consulta | Permitida |
| `cf_kv_keys_list` | true | false | false | Solo consulta | Permitida |
| `cf_kv_namespaces_list` | true | false | false | Solo consulta | Permitida |
| `cf_kv_value_get` | true | false | false | Solo consulta | Permitida |
| `cf_lb_monitors_list` | true | false | false | Solo consulta | Permitida |
| `cf_lb_pools_list` | true | false | false | Solo consulta | Permitida |
| `cf_load_balancer_get` | true | false | false | Solo consulta | Permitida |
| `cf_load_balancers_list` | true | false | false | Solo consulta | Permitida |
| `cf_logpush_job_get` | true | false | false | Solo consulta | Permitida |
| `cf_logpush_jobs_list` | true | false | false | Solo consulta | Permitida |
| `cf_origin_rules_list` | true | false | false | Solo consulta | Permitida |
| `cf_origin_rules_replace` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_page_rule_create` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_page_rule_delete` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_page_rule_update` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_page_rules_list` | true | false | false | Solo consulta | Permitida |
| `cf_quick_status` | true | false | false | Solo consulta | Permitida |
| `cf_redirect_rules_list` | true | false | false | Solo consulta | Permitida |
| `cf_redirect_rules_replace` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_rules_list_items` | true | false | false | Solo consulta | Permitida |
| `cf_rules_lists_list` | true | false | false | Solo consulta | Permitida |
| `cf_ruleset_entrypoint_get` | true | false | false | Solo consulta | Permitida |
| `cf_ruleset_entrypoint_update` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_rulesets_list` | true | false | false | Solo consulta | Permitida |
| `cf_snippet_rules_list` | true | false | false | Solo consulta | Permitida |
| `cf_snippets_list` | true | false | false | Solo consulta | Permitida |
| `cf_ssl_certificate_packs` | true | false | false | Solo consulta | Permitida |
| `cf_ssl_mode_get` | true | false | false | Solo consulta | Permitida |
| `cf_ssl_mode_set` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_ssl_verification` | true | false | false | Solo consulta | Permitida |
| `cf_transform_rules_list` | true | false | false | Solo consulta | Permitida |
| `cf_transform_rules_replace` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_waf_custom_rules_list` | true | false | false | Solo consulta | Permitida |
| `cf_waf_custom_rules_replace` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_waf_ip_audit` | true | false | false | Solo consulta | Permitida |
| `cf_workers_domains_list` | true | false | false | Solo consulta | Permitida |
| `cf_workers_route_create` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_workers_route_delete` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_workers_route_update` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `cf_workers_routes_list` | true | false | false | Solo consulta | Permitida |
| `cf_workers_script_deployments` | true | false | false | Solo consulta | Permitida |
| `cf_workers_scripts_list` | true | false | false | Solo consulta | Permitida |
| `cf_zone_settings_get` | true | false | false | Solo consulta | Permitida |
| `cf_zone_status` | true | false | false | Solo consulta | Permitida |
| `cf_zones_list` | true | false | false | Solo consulta | Permitida |
| `check_aws_session_for_env` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `check_azure_session_for_account` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `check_azure_session_for_tenant` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `confluence_page_read` | true | false | false | Solo consulta | Permitida |
| `confluence_search` | true | false | false | Solo consulta | Permitida |
| `ctf_content_type_get` | true | false | false | Solo consulta | Permitida |
| `ctf_content_types_list` | true | false | false | Solo consulta | Permitida |
| `ctf_entries_search` | true | false | false | Solo consulta | Permitida |
| `ctf_entry_get` | true | false | false | Solo consulta | Permitida |
| `ctf_environments_list` | true | false | false | Solo consulta | Permitida |
| `ctf_graphql_query` | true | false | false | Solo consulta | Permitida |
| `ctf_graphql_schema_introspect` | true | false | false | Solo consulta | Permitida |
| `ctf_spaces_list` | true | false | false | Solo consulta | Permitida |
| `dd_errors_by_service` | true | false | false | Solo consulta | Permitida |
| `dd_errors_recent` | true | false | false | Solo consulta | Permitida |
| `dd_log_get` | true | false | false | Solo consulta | Permitida |
| `dd_logs_search` | true | false | false | Solo consulta | Permitida |
| `dd_metrics_query` | true | false | false | Solo consulta | Permitida |
| `dd_synthetics_results` | true | false | false | Solo consulta | Permitida |
| `dd_synthetics_summary` | true | false | false | Solo consulta | Permitida |
| `dd_waf_bots` | true | false | false | Solo consulta | Permitida |
| `deployment_status` | true | false | false | Solo consulta | Permitida |
| `dns_lookup` | true | false | false | Solo consulta | Permitida |
| `dnssec_check` | true | false | false | Solo consulta | Permitida |
| `ecs_sync_cluster_metadata` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `eks_sync_cluster_metadata` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `eks_update_kubeconfig` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `env_capacity_overview` | true | false | false | Solo consulta | Permitida |
| `env_errors_overview` | true | false | false | Solo consulta | Permitida |
| `env_health_summary` | true | false | false | Solo consulta | Permitida |
| `ghe_actions_diagnose` | true | false | false | Solo consulta | Permitida |
| `ghe_actions_latest` | true | false | false | Solo consulta | Permitida |
| `ghe_actions_latest_jobs` | true | false | false | Solo consulta | Permitida |
| `ghe_actions_latest_logs` | true | false | false | Solo consulta | Permitida |
| `ghe_branches_list` | true | false | false | Solo consulta | Permitida |
| `ghe_commits_list` | true | false | false | Solo consulta | Permitida |
| `ghe_org_repos` | true | false | false | Solo consulta | Permitida |
| `ghe_pr_detail` | true | false | false | Solo consulta | Permitida |
| `ghe_pr_diff` | true | false | false | Solo consulta | Permitida |
| `ghe_pr_files` | true | false | false | Solo consulta | Permitida |
| `ghe_repo_prs` | true | false | false | Solo consulta | Permitida |
| `ghe_repo_summary` | true | false | false | Solo consulta | Permitida |
| `ghe_search_code` | true | false | false | Solo consulta | Permitida |
| `ghe_tags_list` | true | false | false | Solo consulta | Permitida |
| `ghe_workflow_dispatch` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `ghe_workflow_list` | true | false | false | Solo consulta | Permitida |
| `ghe_workflow_runs_list` | true | false | false | Solo consulta | Permitida |
| `gl_branches_list` | true | false | false | Solo consulta | Permitida |
| `gl_commits_list` | true | false | false | Solo consulta | Permitida |
| `gl_mr_changes` | true | false | false | Solo consulta | Permitida |
| `gl_mr_commits` | true | false | false | Solo consulta | Permitida |
| `gl_mr_diff` | true | false | false | Solo consulta | Permitida |
| `gl_mr_get` | true | false | false | Solo consulta | Permitida |
| `gl_mr_search` | true | false | false | Solo consulta | Permitida |
| `gl_pipeline_diagnose` | true | false | false | Solo consulta | Permitida |
| `gl_pipeline_get` | true | false | false | Solo consulta | Permitida |
| `gl_pipelines_latest` | true | false | false | Solo consulta | Permitida |
| `gl_projects_list` | true | false | false | Solo consulta | Permitida |
| `gl_tags_list` | true | false | false | Solo consulta | Permitida |
| `http_check` | true | false | false | Solo consulta | Permitida |
| `infra_tfvars_catalog` | true | false | false | Solo consulta | Permitida |
| `infra_tfvars_find` | true | false | false | Solo consulta | Permitida |
| `jira_issue_comments` | true | false | false | Solo consulta | Permitida |
| `jira_issue_fulldetails` | true | false | false | Solo consulta | Permitida |
| `jira_issue_get` | true | false | false | Solo consulta | Permitida |
| `jira_issues_list` | true | false | false | Solo consulta | Permitida |
| `jira_issues_recent` | true | false | false | Solo consulta | Permitida |
| `jira_issues_search` | true | false | false | Solo consulta | Permitida |
| `k8s_autodiag_notification` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `k8s_cluster_summary` | true | false | false | Solo consulta | Permitida |
| `k8s_containers_count` | true | false | false | Solo consulta | Permitida |
| `k8s_context_use` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `k8s_contexts` | true | false | false | Solo consulta | Permitida |
| `k8s_cronjob_pods` | true | false | false | Solo consulta | Permitida |
| `k8s_describe` | true | false | false | Solo consulta | Permitida |
| `k8s_find_pod` | true | false | false | Solo consulta | Permitida |
| `k8s_logs` | true | false | false | Solo consulta | Permitida |
| `k8s_node_describe` | true | false | false | Solo consulta | Permitida |
| `k8s_nodes_list` | true | false | false | Solo consulta | Permitida |
| `k8s_pod_previous_logs` | true | false | false | Solo consulta | Permitida |
| `k8s_pods_list` | true | false | false | Solo consulta | Permitida |
| `k8s_replicasets_images` | true | false | false | Solo consulta | Permitida |
| `k8s_replicasets_list` | true | false | false | Solo consulta | Permitida |
| `k8s_resource_yaml` | true | false | false | Solo consulta | Permitida |
| `k8s_rollout_history` | true | false | false | Solo consulta | Permitida |
| `macro_endpoint_health` | true | false | false | Solo consulta | Permitida |
| `macro_env_health` | true | false | false | Solo consulta | Permitida |
| `macro_outage_triage` | true | false | false | Solo consulta | Permitida |
| `memory_invalidate` | false | true | false | Sobrescribe, elimina o revoca estado privado | Bloqueada |
| `memory_purge_user` | false | true | false | Sobrescribe, elimina o revoca estado privado | Bloqueada |
| `memory_search` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `memory_session_touch` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `memory_store` | false | true | false | Sobrescribe, elimina o revoca estado privado | Permitida |
| `observability_daily_digest` | true | false | false | Solo consulta | Permitida |
| `observability_query` | true | false | false | Solo consulta | Permitida |
| `observability_trigger_digest` | false | true | true | Cambio externo o irreversible | Bloqueada |
| `ops_account_link_start` | true | false | false | Solo consulta | Permitida |
| `ops_account_unlink` | false | true | false | Sobrescribe, elimina o revoca estado privado | Bloqueada |
| `ops_accounts_list` | true | false | false | Solo consulta | Permitida |
| `ops_configure_integration` | false | true | false | Sobrescribe, elimina o revoca estado privado | Permitida |
| `ops_context_close` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `ops_context_open` | false | false | false | Cambia estado privado de forma acotada | Permitida |
| `ops_get_work_context` | true | false | false | Solo consulta | Permitida |
| `ops_incident_rollup` | true | false | false | Solo consulta | Permitida |
| `ops_list_integrations` | true | false | false | Solo consulta | Permitida |
| `ops_my_usage` | true | false | false | Solo consulta | Permitida |
| `ops_remove_integration` | false | true | false | Sobrescribe, elimina o revoca estado privado | Permitida |
| `ops_set_work_context` | false | true | false | Sobrescribe, elimina o revoca estado privado | Permitida |
| `ops_status` | true | false | false | Solo consulta | Permitida |
| `ops_test_integration` | true | false | false | Solo consulta | Permitida |
| `pd_incident_get` | true | false | false | Solo consulta | Permitida |
| `pd_incident_log_entries` | true | false | false | Solo consulta | Permitida |
| `pd_incidents_search` | true | false | false | Solo consulta | Permitida |
| `pd_service_get` | true | false | false | Solo consulta | Permitida |
| `pd_services_list` | true | false | false | Solo consulta | Permitida |
| `pingdom_actions_recent` | true | false | false | Solo consulta | Permitida |
| `pingdom_check_get` | true | false | false | Solo consulta | Permitida |
| `pingdom_check_outages` | true | false | false | Solo consulta | Permitida |
| `pingdom_check_probes_status` | true | false | false | Solo consulta | Permitida |
| `pingdom_check_results` | true | false | false | Solo consulta | Permitida |
| `pingdom_check_uptime` | true | false | false | Solo consulta | Permitida |
| `pingdom_checks_list` | true | false | false | Solo consulta | Permitida |
| `pingdom_summary` | true | false | false | Solo consulta | Permitida |
| `prom_alerts` | true | false | false | Solo consulta | Permitida |
| `prom_label_values` | true | false | false | Solo consulta | Permitida |
| `prom_query` | true | false | false | Solo consulta | Permitida |
| `prom_query_range` | true | false | false | Solo consulta | Permitida |
| `prom_rules` | true | false | false | Solo consulta | Permitida |
| `prom_series` | true | false | false | Solo consulta | Permitida |
| `prom_status` | true | false | false | Solo consulta | Permitida |
| `prom_targets` | true | false | false | Solo consulta | Permitida |
| `railway_dashboard` | true | false | false | Solo consulta | Permitida |
| `railway_deployment_get` | true | false | false | Solo consulta | Permitida |
| `railway_deployments_latest` | true | false | false | Solo consulta | Permitida |
| `railway_domains` | true | false | false | Solo consulta | Permitida |
| `railway_env_diff` | true | false | false | Solo consulta | Permitida |
| `railway_env_list` | true | false | false | Solo consulta | Permitida |
| `railway_environments_list` | true | false | false | Solo consulta | Permitida |
| `railway_errors_recent` | true | false | false | Solo consulta | Permitida |
| `railway_health_summary` | true | false | false | Solo consulta | Permitida |
| `railway_incident_diagnosis` | true | false | false | Solo consulta | Permitida |
| `railway_logs` | true | false | false | Solo consulta | Permitida |
| `railway_metrics_summary` | true | false | false | Solo consulta | Permitida |
| `railway_project_status` | true | false | false | Solo consulta | Permitida |
| `railway_projects_list` | true | false | false | Solo consulta | Permitida |
| `railway_service_status` | true | false | false | Solo consulta | Permitida |
| `railway_services_list` | true | false | false | Solo consulta | Permitida |
| `railway_volumes` | true | false | false | Solo consulta | Permitida |
| `repo_env_list` | true | false | false | Solo consulta | Permitida |
| `repo_pipeline_summary` | true | false | false | Solo consulta | Permitida |
| `repos_catalog` | true | false | false | Solo consulta | Permitida |
| `repos_config_find` | true | false | false | Solo consulta | Permitida |
| `repos_list` | true | false | false | Solo consulta | Permitida |
| `repos_search_text` | true | false | false | Solo consulta | Permitida |
| `repos_var_where` | true | false | false | Solo consulta | Permitida |
| `sentry_event_get` | true | false | false | Solo consulta | Permitida |
| `sentry_events_search` | true | false | false | Solo consulta | Permitida |
| `sentry_issues_export` | true | false | false | Solo consulta | Permitida |
| `sentry_issues_get` | true | false | false | Solo consulta | Permitida |
| `sentry_issues_list` | true | false | false | Solo consulta | Permitida |
| `sentry_issues_search` | true | false | false | Solo consulta | Permitida |
| `sentry_logs_search` | true | false | false | Solo consulta | Permitida |
| `sentry_organizations_list` | true | false | false | Solo consulta | Permitida |
| `sentry_projects_list` | true | false | false | Solo consulta | Permitida |
| `sentry_projects_stats` | true | false | false | Solo consulta | Permitida |
| `sq_analyses_latest` | true | false | false | Solo consulta | Permitida |
| `sq_branches_list` | true | false | false | Solo consulta | Permitida |
| `sq_duplications_show` | true | false | false | Solo consulta | Permitida |
| `sq_hotspots_search` | true | false | false | Solo consulta | Permitida |
| `sq_issues_search` | true | false | false | Solo consulta | Permitida |
| `sq_last_scan_summary` | true | false | false | Solo consulta | Permitida |
| `sq_measures_summary` | true | false | false | Solo consulta | Permitida |
| `sq_projects_search` | true | false | false | Solo consulta | Permitida |
| `sq_pull_requests_list` | true | false | false | Solo consulta | Permitida |
| `sq_quality_gate_status` | true | false | false | Solo consulta | Permitida |
| `synthetics_summary_by_location` | true | false | false | Solo consulta | Permitida |
| `system_update` | false | true | false | Sobrescribe, elimina o revoca estado privado | Bloqueada |
| `tcp_connect` | true | false | false | Solo consulta | Permitida |
| `traceroute` | true | false | false | Solo consulta | Permitida |
| `vercel_deployment_logs` | true | false | false | Solo consulta | Permitida |
| `vercel_deploys_latest` | true | false | false | Solo consulta | Permitida |
| `vercel_env_diff` | true | false | false | Solo consulta | Permitida |
| `vercel_env_diff_repo` | true | false | false | Solo consulta | Permitida |
| `vercel_env_list` | true | false | false | Solo consulta | Permitida |
| `vercel_env_sources` | true | false | false | Solo consulta | Permitida |
| `vercel_project_status` | true | false | false | Solo consulta | Permitida |
| `vercel_projects_list` | true | false | false | Solo consulta | Permitida |

