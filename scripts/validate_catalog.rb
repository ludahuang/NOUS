#!/usr/bin/env ruby

require "date"
require "json"
require "pathname"
require "uri"
require "yaml"

ROOT = Pathname.new(__dir__).join("..").expand_path
CATALOG_PATH = ROOT.join("catalog/index.yaml")

def fail_with(message)
  warn("catalog validation failed: #{message}")
  exit(1)
end

def load_yaml(path)
  YAML.safe_load(
    path.read,
    permitted_classes: [Date],
    aliases: false
  )
rescue Psych::SyntaxError => error
  fail_with("#{path.relative_path_from(ROOT)} is invalid YAML: #{error.message}")
end

def collect_refs(value, refs = [])
  case value
  when Hash
    refs << value["ref"] if value["ref"].is_a?(String)
    value.each_value { |child| collect_refs(child, refs) }
  when Array
    value.each { |child| collect_refs(child, refs) }
  end

  refs
end

fail_with("missing catalog/index.yaml") unless CATALOG_PATH.file?

index = load_yaml(CATALOG_PATH)
paths = Array(index["entities"]) + Array(index["sources"])
fail_with("catalog index is empty") if paths.empty?

records = paths.map do |relative|
  path = ROOT.join(relative).cleanpath
  fail_with("indexed file does not exist: #{relative}") unless path.file?

  record = load_yaml(path)
  %w[id type name status].each do |field|
    fail_with("#{relative} is missing #{field}") if record[field].to_s.strip.empty?
  end

  if relative.start_with?("research/sites/")
    fail_with("#{relative} is missing accessed") if record["accessed"].nil?
    fail_with("#{relative} is missing rights") if record["rights"].to_s.strip.empty?
    fail_with("#{relative} must use an HTTPS source URL") unless record["url"].to_s.start_with?("https://")
  end

  [relative, record]
end

ids = records.map { |_, record| record["id"] }
duplicates = ids.group_by(&:itself).select { |_, values| values.length > 1 }.keys
fail_with("duplicate IDs: #{duplicates.join(', ')}") unless duplicates.empty?

known_ids = ids.to_h { |id| [id, true] }
known_ids["nous"] = true

records.each do |relative, record|
  collect_refs(record).uniq.each do |ref|
    fail_with("#{relative} references unknown entity #{ref}") unless known_ids[ref]
  end
end

schema_path = ROOT.join("schemas/nous-entity.schema.json")
fail_with("missing schemas/nous-entity.schema.json") unless schema_path.file?

begin
  JSON.parse(schema_path.read)
rescue JSON::ParserError => error
  fail_with("invalid JSON schema: #{error.message}")
end

root_manifest = load_yaml(ROOT.join("nous.yaml"))
fail_with("nous.yaml must identify the root as nous") unless root_manifest["id"] == "nous"

markdown_links = 0

ROOT.glob("**/*.md").sort.each do |markdown_path|
  markdown_path.read.scan(/\]\(([^)]+)\)/).flatten.each do |raw_target|
    target = raw_target.strip
    next if target.empty?
    next if target.start_with?("#", "http://", "https://", "mailto:")

    path_part = URI.decode_www_form_component(target.split("#", 2).first.split("?", 2).first)
    next if path_part.empty?

    resolved = markdown_path.dirname.join(path_part).cleanpath
    fail_with(
      "#{markdown_path.relative_path_from(ROOT)} links to missing path #{target}"
    ) unless resolved.exist?

    markdown_links += 1
  end
end

puts(
  "Validated #{records.length} catalog and source records, " \
  "#{ids.length} unique IDs, and #{markdown_links} local Markdown links."
)
