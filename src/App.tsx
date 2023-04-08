import { useState } from 'react';
import './styles/global.css';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from './lib/supabase';

const createUserFormSchema = z.object({
	avatar: z
		.instanceof(FileList)
		.transform((list) => list.item(0)!)
		.refine(
			(file) => file.size <= 5 * 1024 * 1024,
			' O arquivo só pode ter no máximo 5MB'
		),
	name: z
		.string()
		.nonempty('O nome é obrigatório')
		.transform((name) => {
			return name
				.trim()
				.toLowerCase()
				.split(' ')
				.map((word) => {
					return word[0].toLocaleUpperCase().concat(word.substring(1));
				})
				.join(' ');
		}),

	email: z
		.string()
		.nonempty('O email é obrigatório')
		.email('Formato de e-mail inválido')
		.toLowerCase()
		.refine((email) => {
			return email.endsWith('@gmail.com');
		}, 'Apenas e-mails @gmail.com'),
	password: z.string().min(6, 'A senha precisa de no mínimo 6 caracteres'),
	techs: z
		.array(
			z.object({
				title: z.string().nonempty('O título é obrigatório'),
				knowledge: z.coerce.number().min(1).max(100),
			})
		)
		.min(2, 'Insira pelo menos 2 tecnologias')
		.refine((techs) => {
			return techs.some((tech) => tech.knowledge > 50);
		}, 'Vocé ainda é newbie em tech'),
});
type CreateUserFormData = z.infer<typeof createUserFormSchema>;

function App() {
	const [output, setOutput] = useState('');
	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<CreateUserFormData>({
		resolver: zodResolver(createUserFormSchema),
	});

	async function createUser(data: CreateUserFormData) {
		await supabase.storage
			.from('advanced-form')
			.upload(data.avatar.name, data.avatar, {
				cacheControl: '3600',
				upsert: false,
			});

		setOutput(JSON.stringify(data, null, 2));
	}
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'techs',
	});

	function addNewTech() {
		append({ title: '', knowledge: 0 });
	}
	return (
		<main
			className={
				'h-screen flex flex-col items-center justify-center gap-10 ' +
				'bg-zinc-50 dark:text-zinc-300 dark:bg-zinc-800'
			}
		>
			<form
				className='w-full flex flex-col gap-4 max-w-xs'
				onSubmit={handleSubmit(createUser)}
			>
				<div className='flex flex-col gap-1'>
					<label htmlFor='avatar'>Avatar</label>
					<input
						className={
							'h-10 px-3 ' +
							'border rounded shadow-sm ' +
							'border-zinc-200 dark:bg-zinc-700 dark:border-zinc-500 dark:text-zinc-100'
						}
						type='file'
						accept='image/*'
						{...register('avatar')}
					/>
					{errors.avatar && (
						<span className='text-red-400 text-sm'>
							{errors.avatar.message}
						</span>
					)}
				</div>
				<div className='flex flex-col gap-1'>
					<label htmlFor='name'>Nome</label>
					<input
						className={
							'h-10 px-3 ' +
							'border rounded shadow-sm ' +
							'border-zinc-200 dark:bg-zinc-700 dark:border-zinc-500 dark:text-zinc-100'
						}
						type='text'
						{...register('name')}
					/>
					{errors.name && (
						<span className='text-red-400 text-sm'>{errors.name.message}</span>
					)}
				</div>
				<div className='flex flex-col gap-1'>
					<label htmlFor='email'>E-mail</label>
					<input
						className={
							'h-10 px-3 ' +
							'border rounded shadow-sm ' +
							'border-zinc-200 dark:bg-zinc-700 dark:border-zinc-500 dark:text-zinc-100'
						}
						type='email'
						{...register('email')}
					/>
					{errors.email && (
						<span className='text-red-400 text-sm'>{errors.email.message}</span>
					)}
				</div>
				<div className='flex flex-col gap-1'>
					<label htmlFor='password'>Senha</label>
					<input
						className={
							'h-10 px-3 ' +
							'border rounded shadow-sm ' +
							'border-zinc-200 dark:bg-zinc-700 dark:border-zinc-500 dark:text-zinc-100'
						}
						type='password'
						{...register('password')}
					/>
					{errors.password && (
						<span className='text-red-400 text-sm'>
							{errors.password.message}
						</span>
					)}
				</div>

				<div className='flex flex-col gap-1'>
					<label
						htmlFor='techs'
						className={'flex items-center justify-between'}
					>
						Tecnologias
						<button
							type='button'
							onClick={addNewTech}
							className={'text-emerald-500 text-xs'}
						>
							Adicionar
						</button>
					</label>
					{fields.map((field, index) => {
						return (
							<div
								key={field.id}
								className='flex gap-2'
							>
								<div className='flex flex-1 flex-col gap-1'>
									<input
										className={
											'h-10 px-3 ' +
											'border rounded shadow-sm ' +
											'border-zinc-200 dark:bg-zinc-700 dark:border-zinc-500 dark:text-zinc-100'
										}
										type='text'
										{...register(`techs.${index}.title`)}
									/>
								</div>
								{errors.techs?.[index]?.title && (
									<span className='text-red-400 text-sm'>
										{errors.techs?.[index]?.title?.message}
									</span>
								)}
								<div className='flex flex-1 flex-col gap-1'>
									<input
										className={
											'w-24 h-10 px-3 ' +
											'border rounded shadow-sm ' +
											'border-zinc-200 dark:bg-zinc-700 dark:border-zinc-500 dark:text-zinc-100'
										}
										type='number'
										{...register(`techs.${index}.knowledge`)}
									/>
									{errors.techs?.[index]?.knowledge && (
										<span className='text-red-400 text-sm'>
											{errors.techs?.[index]?.knowledge?.message}
										</span>
									)}
								</div>
							</div>
						);
					})}
					{errors.techs && (
						<span className='text-red-400 text-sm'>{errors.techs.message}</span>
					)}
				</div>

				<button
					className={
						'h-10 rounded font-semibold ' +
						'bg-emerald-500 text-white hover:bg-emerald-600'
					}
					type='submit'
				>
					Salvar
				</button>
			</form>

			<pre>{output}</pre>
		</main>
	);
}

export default App;
