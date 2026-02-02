export function TailwindDemo() {
	return (
		<div class="p-8 font-sans max-w-4xl mx-auto space-y-8 bg-white min-h-screen">
			<header class="space-y-2">
				<h1 class="text-4xl font-black text-gray-900 tracking-tight">
					Dynamic Tailwind CSS
				</h1>
				<p class="text-lg text-gray-600">
					Lightweight engine with arbitrary values, modifiers, and zero configuration.
				</p>
			</header>
			
			<section class="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Arbitrary Values */}
				<div class="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
					<h3 class="text-xl font-bold">Arbitrary Values</h3>
					<div class="flex flex-wrap gap-4">
						<div class="h-[60px] w-[60px] bg-[#3b82f6] rounded-[12px] flex items-center justify-center text-white font-bold shadow-lg">
							HEX
						</div>
						<div class="h-[60px] w-[120px] bg-[rgb(239,68,68)] rounded-full flex items-center justify-center text-white font-bold">
							RGB
						</div>
						<div class="w-[calc(100%-1rem)] p-[20px] bg-green-500/10 text-green-700 rounded-lg border border-green-200">
							calc(100% - 1rem)
						</div>
					</div>
				</div>
				
				{/* Modifiers */}
				<div class="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
					<h3 class="text-xl font-bold">State Modifiers</h3>
					<div class="flex flex-wrap gap-4">
						<button class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg transition-all hover:bg-blue-700 hover:scale-[1.05] active:scale-[0.95] focus:ring-4 ring-blue-500/30">
							Hover & Active
						</button>
						<input
							placeholder="Focus me..."
							class="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 ring-blue-500/20"
						/>
					</div>
				</div>
				
				{/* Typography & Spacing */}
				<div class="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
					<h3 class="text-xl font-bold">Advanced Sizing</h3>
					<div class="space-y-2">
						<div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
							<div class="h-full bg-blue-500 w-[75%]" />
						</div>
						<div class="flex justify-between text-xs font-mono text-gray-500">
							<span>w-[75%]</span>
							<span>h-2</span>
						</div>
						<div class="mt-4 p-[clamp(1rem,5vw,3rem)] bg-purple-100 text-purple-700 rounded-lg text-center font-bold">
							p-[clamp(1rem,5vw,3rem)]
						</div>
					</div>
				</div>
				
				{/* Custom Config Extension */}
				<div class="p-6 bg-brand/10 rounded-2xl border border-brand/20 space-y-4">
					<h3 class="text-xl font-bold text-brand">Config Extensions</h3>
					<div class="grid grid-cols-2 gap-2">
						<div class="p-3 bg-primary-500 text-white rounded-lg text-sm text-center">Primary 500</div>
						<div class="p-3 bg-secondary-500 text-white rounded-lg text-sm text-center">Secondary 500</div>
						<div class="p-3 bg-success text-white rounded-lg text-sm text-center">Success</div>
						<div class="p-3 bg-warning text-white rounded-lg text-sm text-center">Warning</div>
					</div>
				</div>
			</section>
			
			<footer class="p-8 bg-gray-900 rounded-3xl text-white space-y-4">
				<div class="flex items-center gap-3">
					<div class="h-10 w-10 bg-blue-500 rounded-xl animate-pulse" />
					<div>
						<h4 class="font-bold">Next Steps</h4>
						<p class="text-gray-400 text-sm">Responsive design and complex animations.</p>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
					<div class="space-y-1">
						<div class="text-2xl font-black">25kb</div>
						<div class="text-xs text-gray-500 uppercase">Bundle Size</div>
					</div>
					<div class="space-y-1">
						<div class="text-2xl font-black">150+</div>
						<div class="text-xs text-gray-500 uppercase">Utilities</div>
					</div>
					<div class="space-y-1">
						<div class="text-2xl font-black">∞</div>
						<div class="text-xs text-gray-500 uppercase">Arbitrary Values</div>
					</div>
				</div>
			</footer>
		</div>
	);
}