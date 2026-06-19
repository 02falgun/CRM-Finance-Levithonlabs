import json
from pathlib import Path
from datetime import datetime, timezone
from graphify.benchmark import run_benchmark, print_benchmark
from graphify.detect import detect, save_manifest

# save manifest for --update
result = detect(Path('.'))
save_manifest(result['files'])

cost_path = Path('graphify-out/cost.json')
cost = json.loads(cost_path.read_text(encoding='utf-8')) if cost_path.exists() else {'runs': [], 'total_input_tokens': 0, 'total_output_tokens': 0}
if not cost['runs']:
    cost['runs'].append({
        'date': datetime.now(timezone.utc).isoformat(),
        'input_tokens': 0,
        'output_tokens': 0,
        'files': 67,
    })
    cost_path.write_text(json.dumps(cost, indent=2), encoding='utf-8')
print(f"This run: 0 input tokens, 0 output tokens")
print(f"All time: {cost['total_input_tokens']:,} input, {cost['total_output_tokens']:,} output ({len(cost['runs'])} runs)")

result = run_benchmark('graphify-out/graph.json', corpus_words=333766)
print_benchmark(result)

for f in [
    '.graphify_detect.json', '.graphify_extract.json', '.graphify_ast.json',
    '.graphify_semantic.json', '.graphify_analysis.json', '.graphify_labels.json',
    '.graphify_run_ast.py', '.graphify_run_detect.py', '.graphify_run_cache.py',
    '.graphify_merge.py', '.graphify_build.py', '.graphify_finish.py',
]:
    p = Path(f)
    if p.exists():
        p.unlink()
print('Cleanup done')
